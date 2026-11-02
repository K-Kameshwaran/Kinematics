/**
 * Kinematics - Denavit-Hartenberg Matrix Math, Forward Kinematics,
 * and Levenberg-Marquardt Damped Least Squares Numerical Inverse Kinematics.
 */

import { CartesianPose, DHRow } from './types';

// 4x4 Matrix multiplication: C = A * B
export function mat4Multiply(a: number[][], b: number[][]): number[][] {
  const c: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i][k] * b[k][j];
      }
      c[i][j] = sum;
    }
  }
  return c;
}

export function mat4Identity(): number[][] {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Standard Denavit-Hartenberg Transformation Matrix
 * T = Rot_z(theta) * Trans_z(d) * Trans_x(a) * Rot_x(alpha)
 *
 * [ cos(th)   -sin(th)*cos(al)    sin(th)*sin(al)   a*cos(th) ]
 * [ sin(th)    cos(th)*cos(al)   -cos(th)*sin(al)   a*sin(th) ]
 * [    0           sin(al)            cos(al)           d     ]
 * [    0              0                  0              1     ]
 */
export function dhTransform(theta: number, d: number, a: number, alpha: number): number[][] {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return [
    [ct, -st * ca,  st * sa, a * ct],
    [st,  ct * ca, -ct * sa, a * st],
    [0,        sa,       ca,      d],
    [0,         0,        0,      1],
  ];
}

/**
 * Forward Kinematics: Computes cumulative transformation matrices for all joints
 * Returns array of 4x4 transformation matrices from base frame (T_0) to end effector (T_n)
 */
export function computeForwardKinematics(dhTable: DHRow[], jointAngles: number[]): number[][][] {
  const frames: number[][][] = [mat4Identity()];
  let currentT = mat4Identity();

  for (let i = 0; i < dhTable.length; i++) {
    const row = dhTable[i];
    const theta = (jointAngles[i] ?? 0) + row.theta;
    const Ti = dhTransform(theta, row.d, row.a, row.alpha);
    currentT = mat4Multiply(currentT, Ti);
    frames.push(currentT);
  }

  return frames;
}

/**
 * Converts DH frame origin [X, Y, Z, 1] to Three.js world coordinates.
 * Standard DH conventions have Z pointing along the joint axis.
 * In Three.js: X is right, Y is up, Z is forward/out-of-screen.
 * In standard robotics DH: Z is vertical along base joint 1.
 * Mapping: Three.js X = DH X, Three.js Y = DH Z, Three.js Z = -DH Y
 */
export function dhToThreeWorld(dhMatrix: number[][]): [number, number, number] {
  const x = dhMatrix[0][3];
  const y = dhMatrix[1][3];
  const z = dhMatrix[2][3];
  return [x, z, -y];
}

/**
 * Extracts Euler angles (Roll, Pitch, Yaw - XYZ extrinsic / ZYX intrinsic) from 3x3 rotation block
 */
export function rotationToRPY(R: number[][]): [number, number, number] {
  let roll = 0;
  let pitch = 0;
  let yaw = 0;

  // Sy = sqrt(R00^2 + R10^2)
  const sy = Math.sqrt(R[0][0] * R[0][0] + R[1][0] * R[1][0]);
  const singular = sy < 1e-6;

  if (!singular) {
    roll = Math.atan2(R[2][1], R[2][2]);
    pitch = Math.atan2(-R[2][0], sy);
    yaw = Math.atan2(R[1][0], R[0][0]);
  } else {
    roll = Math.atan2(-R[1][2], R[1][1]);
    pitch = Math.atan2(-R[2][0], sy);
    yaw = 0;
  }

  return [roll, pitch, yaw];
}

/**
 * Calculates current end effector Cartesian pose from joint angles
 */
export function getEndEffectorPose(dhTable: DHRow[], jointAngles: number[]): CartesianPose {
  const frames = computeForwardKinematics(dhTable, jointAngles);
  const endT = frames[frames.length - 1];
  const [x, y, z] = dhToThreeWorld(endT);
  const [roll, pitch, yaw] = rotationToRPY(endT);

  return {
    x,
    y,
    z,
    roll,
    pitch,
    yaw,
    matrix: endT,
  };
}

/**
 * Levenberg-Marquardt Damped Least Squares (DLS) Inverse Kinematics Solver
 * Tailored for straight-line Cartesian motions on the whiteboard surface with tool-down constraint.
 *
 * J = numerical position Jacobian (3xN)
 * d_theta = J^T * (J * J^T + lambda^2 * I)^(-1) * delta_x
 */
export function solveLevenbergMarquardtIK(
  dhTable: DHRow[],
  currentAngles: number[],
  targetWorldPos: [number, number, number],
  options: {
    maxIterations?: number;
    tolerance?: number;
    damping?: number;
    maxStep?: number;
  } = {}
): { angles: number[]; converged: boolean; finalError: number } {
  const maxIterations = options.maxIterations ?? 40;
  const tolerance = options.tolerance ?? 0.003; // 3 mm
  const damping = options.damping ?? 0.05;
  const maxStep = options.maxStep ?? 0.15; // rad max joint delta per iter

  const q = [...currentAngles];
  const n = dhTable.length;
  let errorDist = Infinity;

  for (let iter = 0; iter < maxIterations; iter++) {
    const curPose = getEndEffectorPose(dhTable, q);
    const ex = targetWorldPos[0] - curPose.x;
    const ey = targetWorldPos[1] - curPose.y;
    const ez = targetWorldPos[2] - curPose.z;

    errorDist = Math.sqrt(ex * ex + ey * ey + ez * ez);
    if (errorDist < tolerance) {
      return { angles: q, converged: true, finalError: errorDist };
    }

    // Compute 3xN Jacobian numerically
    const deltaH = 1e-4;
    const J: number[][] = [
      new Array(n).fill(0),
      new Array(n).fill(0),
      new Array(n).fill(0),
    ];

    for (let j = 0; j < n; j++) {
      q[j] += deltaH;
      const pPlus = getEndEffectorPose(dhTable, q);
      q[j] -= deltaH;

      J[0][j] = (pPlus.x - curPose.x) / deltaH;
      J[1][j] = (pPlus.y - curPose.y) / deltaH;
      J[2][j] = (pPlus.z - curPose.z) / deltaH;
    }

    // JJ^T is 3x3
    const JJt: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += J[r][k] * J[c][k];
        }
        if (r === c) {
          sum += damping * damping;
        }
        JJt[r][c] = sum;
      }
    }

    // Invert 3x3 matrix JJt
    const invJJt = invert3x3(JJt);
    if (!invJJt) break;

    // y = invJJt * [ex, ey, ez]^T (3x1)
    const y0 = invJJt[0][0] * ex + invJJt[0][1] * ey + invJJt[0][2] * ez;
    const y1 = invJJt[1][0] * ex + invJJt[1][1] * ey + invJJt[1][2] * ez;
    const y2 = invJJt[2][0] * ex + invJJt[2][1] * ey + invJJt[2][2] * ez;

    // deltaQ = J^T * y (n x 1)
    for (let j = 0; j < n; j++) {
      let dq = J[0][j] * y0 + J[1][j] * y1 + J[2][j] * y2;
      // Clamp joint step for numerical stability
      dq = Math.max(-maxStep, Math.min(maxStep, dq));
      q[j] += dq;

      // Clamp to joint limits
      q[j] = Math.max(dhTable[j].min, Math.min(dhTable[j].max, q[j]));
    }
  }

  return { angles: q, converged: errorDist < tolerance * 2, finalError: errorDist };
}

// Invert 3x3 matrix analytical helper
function invert3x3(m: number[][]): number[][] | null {
  const a = m[0][0], b = m[0][1], c = m[0][2];
  const d = m[1][0], e = m[1][1], f = m[1][2];
  const g = m[2][0], h = m[2][1], i = m[2][2];

  const A =  (e * i - f * h);
  const B = -(d * i - f * g);
  const C =  (d * h - e * g);
  const D = -(b * i - c * h);
  const E =  (a * i - c * g);
  const F = -(a * h - b * g);
  const G =  (b * f - c * e);
  const H = -(a * f - c * d);
  const I =  (a * e - b * d);

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-10) return null;

  const invDet = 1 / det;
  return [
    [A * invDet, D * invDet, G * invDet],
    [B * invDet, E * invDet, H * invDet],
    [C * invDet, F * invDet, I * invDet],
  ];
}

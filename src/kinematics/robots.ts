/**
 * Kinematics - Robot Models & Denavit-Hartenberg Parameters
 * Official parameters sourced from Universal Robots documentation and Caltech ME/CDS/EE 235a.
 */

import { RobotDef, RobotModelId } from './types';

const PI = Math.PI;

export const ROBOTS: Record<RobotModelId, RobotDef> = {
  ur10e: {
    id: 'ur10e',
    name: 'Universal Robots UR10e',
    tagline: 'Heavy-duty 6-DOF industrial collaborative robot (1300 mm reach, 12.5 kg payload)',
    dof: 6,
    reachMm: 1300,
    payloadKg: 12.5,
    baseHeight: 0.181,
    baseRadius: 0.08,
    dh: [
      { theta: 0, d: 0.181, a: 0, alpha: PI / 2, min: -2 * PI, max: 2 * PI, name: 'Base (θ₁)' },
      { theta: 0, d: 0, a: -0.613, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Shoulder (θ₂)' },
      { theta: 0, d: 0, a: -0.571, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Elbow (θ₃)' },
      { theta: 0, d: 0.174, a: 0, alpha: PI / 2, min: -2 * PI, max: 2 * PI, name: 'Wrist 1 (θ₄)' },
      { theta: 0, d: 0.120, a: 0, alpha: -PI / 2, min: -2 * PI, max: 2 * PI, name: 'Wrist 2 (θ₅)' },
      { theta: 0, d: 0.117, a: 0, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Wrist 3 (θ₆)' },
    ],
    linkColors: ['#334155', '#475569', '#64748B', '#0EA5E9', '#0284C7', '#0369A1'],
    jointColors: ['#00D4AA', '#00D4AA', '#00D4AA', '#38BDF8', '#38BDF8', '#F59E0B'],
  },
  ur5e: {
    id: 'ur5e',
    name: 'Universal Robots UR5e',
    tagline: 'Medium-duty 6-DOF industrial cobot (850 mm reach, 5.0 kg payload)',
    dof: 6,
    reachMm: 850,
    payloadKg: 5.0,
    baseHeight: 0.163,
    baseRadius: 0.07,
    dh: [
      { theta: 0, d: 0.163, a: 0, alpha: PI / 2, min: -2 * PI, max: 2 * PI, name: 'Base (θ₁)' },
      { theta: 0, d: 0, a: -0.425, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Shoulder (θ₂)' },
      { theta: 0, d: 0, a: -0.392, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Elbow (θ₃)' },
      { theta: 0, d: 0.133, a: 0, alpha: PI / 2, min: -2 * PI, max: 2 * PI, name: 'Wrist 1 (θ₄)' },
      { theta: 0, d: 0.100, a: 0, alpha: -PI / 2, min: -2 * PI, max: 2 * PI, name: 'Wrist 2 (θ₅)' },
      { theta: 0, d: 0.100, a: 0, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Wrist 3 (θ₆)' },
    ],
    linkColors: ['#334155', '#475569', '#64748B', '#0EA5E9', '#0284C7', '#0369A1'],
    jointColors: ['#00D4AA', '#00D4AA', '#00D4AA', '#38BDF8', '#38BDF8', '#F59E0B'],
  },
  ur3e: {
    id: 'ur3e',
    name: 'Universal Robots UR3e',
    tagline: 'Compact tabletop 6-DOF collaborative arm (500 mm reach, 3.0 kg payload)',
    dof: 6,
    reachMm: 500,
    payloadKg: 3.0,
    baseHeight: 0.152,
    baseRadius: 0.06,
    dh: [
      { theta: 0, d: 0.152, a: 0, alpha: PI / 2, min: -2 * PI, max: 2 * PI, name: 'Base (θ₁)' },
      { theta: 0, d: 0, a: -0.244, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Shoulder (θ₂)' },
      { theta: 0, d: 0, a: -0.213, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Elbow (θ₃)' },
      { theta: 0, d: 0.112, a: 0, alpha: PI / 2, min: -2 * PI, max: 2 * PI, name: 'Wrist 1 (θ₄)' },
      { theta: 0, d: 0.085, a: 0, alpha: -PI / 2, min: -2 * PI, max: 2 * PI, name: 'Wrist 2 (θ₅)' },
      { theta: 0, d: 0.082, a: 0, alpha: 0, min: -2 * PI, max: 2 * PI, name: 'Wrist 3 (θ₆)' },
    ],
    linkColors: ['#334155', '#475569', '#64748B', '#0EA5E9', '#0284C7', '#0369A1'],
    jointColors: ['#00D4AA', '#00D4AA', '#00D4AA', '#38BDF8', '#38BDF8', '#F59E0B'],
  },
  '2dof': {
    id: '2dof',
    name: '2-DOF Planar Arm',
    tagline: 'Simplified two-link educational model for planar workspace & kinematics',
    dof: 2,
    reachMm: 750,
    payloadKg: 1.0,
    baseHeight: 0.100,
    baseRadius: 0.06,
    dh: [
      { theta: 0, d: 0.100, a: 0.400, alpha: 0, min: -PI, max: PI, name: 'Joint 1 (θ₁)' },
      { theta: 0, d: 0, a: 0.350, alpha: 0, min: -PI, max: PI, name: 'Joint 2 (θ₂)' },
    ],
    linkColors: ['#334155', '#0EA5E9'],
    jointColors: ['#00D4AA', '#F59E0B'],
  },
  '3dof': {
    id: '3dof',
    name: '3-DOF Spatial Arm',
    tagline: 'Three-link educational model for spatial 3D reach and positioning',
    dof: 3,
    reachMm: 650,
    payloadKg: 1.5,
    baseHeight: 0.200,
    baseRadius: 0.06,
    dh: [
      { theta: 0, d: 0.200, a: 0, alpha: PI / 2, min: -PI, max: PI, name: 'Waist (θ₁)' },
      { theta: 0, d: 0, a: 0.350, alpha: 0, min: -PI, max: PI, name: 'Shoulder (θ₂)' },
      { theta: 0, d: 0, a: 0.300, alpha: 0, min: -PI, max: PI, name: 'Elbow (θ₃)' },
    ],
    linkColors: ['#334155', '#475569', '#0EA5E9'],
    jointColors: ['#00D4AA', '#38BDF8', '#F59E0B'],
  },
};

export const INITIAL_JOINT_ANGLES: Record<RobotModelId, number[]> = {
  ur10e: [0, -PI / 2, PI / 2, -PI / 2, -PI / 2, 0],
  ur5e: [0, -PI / 2, PI / 2, -PI / 2, -PI / 2, 0],
  ur3e: [0, -PI / 2, PI / 2, -PI / 2, -PI / 2, 0],
  '2dof': [PI / 4, PI / 4],
  '3dof': [0, PI / 4, PI / 4],
};

/**
 * Kinematics - Rigid-Body Physics & Object Interaction
 * Handles table/floor collision, gravity, bounce, friction, and gripper grasping.
 */

import { SceneObject } from './types';

export const TABLE_SURFACE_Y = 0.0;
export const TABLE_BOUNDS = { minX: -0.8, maxX: 0.8, minZ: -0.8, maxZ: 0.8 };
export const FLOOR_Y = -0.75;

export const INITIAL_SCENE_OBJECTS: SceneObject[] = [
  {
    id: 'block_cyan',
    name: 'Cyan Block',
    type: 'box',
    position: [0.35, 0.035, -0.25],
    size: [0.06, 0.07, 0.06],
    color: '#00D4AA',
    isHeld: false,
    velocity: [0, 0, 0],
  },
  {
    id: 'block_amber',
    name: 'Amber Block',
    type: 'box',
    position: [0.25, 0.035, -0.35],
    size: [0.06, 0.07, 0.06],
    color: '#F59E0B',
    isHeld: false,
    velocity: [0, 0, 0],
  },
  {
    id: 'cylinder_blue',
    name: 'Blue Cylinder',
    type: 'cylinder',
    position: [-0.30, 0.045, -0.25],
    size: [0.035, 0.09, 0.035],
    color: '#38BDF8',
    isHeld: false,
    velocity: [0, 0, 0],
  },
  {
    id: 'sphere_rose',
    name: 'Rose Sphere',
    type: 'sphere',
    position: [-0.25, 0.035, -0.38],
    size: [0.035, 0.035, 0.035],
    color: '#F43F5E',
    isHeld: false,
    velocity: [0, 0, 0],
  },
];

export function stepPhysics(
  objects: SceneObject[],
  deltaTime: number,
  gripperPos: [number, number, number],
  gripperOpenAmount: number // 0 (closed) to 1 (fully open)
): SceneObject[] {
  const dt = Math.min(deltaTime, 0.05); // clamp step
  const gravity = -9.81;
  const bounce = 0.35;
  const friction = 0.88;
  const grabRadius = 0.09;

  return objects.map((obj) => {
    // If object is currently held by gripper
    if (obj.isHeld) {
      // If gripper opened (> 0.25), release it
      if (gripperOpenAmount > 0.25) {
        return {
          ...obj,
          isHeld: false,
          position: [gripperPos[0], gripperPos[1] - 0.02, gripperPos[2]],
          velocity: [0, -0.1, 0],
        };
      }
      // Follow gripper
      return {
        ...obj,
        position: [gripperPos[0], gripperPos[1] - 0.02, gripperPos[2]],
        velocity: [0, 0, 0],
      };
    }

    // Check if gripper can grab this object
    if (gripperOpenAmount <= 0.2) {
      const dx = gripperPos[0] - obj.position[0];
      const dy = gripperPos[1] - obj.position[1];
      const dz = gripperPos[2] - obj.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < grabRadius) {
        return {
          ...obj,
          isHeld: true,
          position: [gripperPos[0], gripperPos[1] - 0.02, gripperPos[2]],
          velocity: [0, 0, 0],
        };
      }
    }

    // Unheld free-falling or resting object physics
    let [vx, vy, vz] = obj.velocity;
    let [px, py, pz] = obj.position;

    vy += gravity * dt;
    px += vx * dt;
    py += vy * dt;
    pz += vz * dt;

    const halfHeight = obj.size[1] / 2;
    // Check table surface
    const onTable =
      px >= TABLE_BOUNDS.minX &&
      px <= TABLE_BOUNDS.maxX &&
      pz >= TABLE_BOUNDS.minZ &&
      pz <= TABLE_BOUNDS.maxZ;

    const groundLevel = onTable ? TABLE_SURFACE_Y : FLOOR_Y;

    if (py - halfHeight <= groundLevel) {
      py = groundLevel + halfHeight;
      if (Math.abs(vy) > 0.2) {
        vy = -vy * bounce;
      } else {
        vy = 0;
      }
      vx *= friction;
      vz *= friction;
    }

    return {
      ...obj,
      position: [px, py, pz],
      velocity: [vx, vy, vz],
    };
  });
}

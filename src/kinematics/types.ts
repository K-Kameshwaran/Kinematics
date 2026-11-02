/**
 * Kinematics - Type Definitions for Robot Manipulator Simulator
 */

export type RobotModelId = 'ur10e' | 'ur5e' | 'ur3e' | '2dof' | '3dof';

export type AppMode = 'learn' | 'play' | 'simulate' | 'draw' | 'report' | 'video';

export interface DHRow {
  theta: number; // in rad (initial/offset)
  d: number;     // in m (link offset along Z)
  a: number;     // in m (link length along X)
  alpha: number; // in rad (link twist about X)
  min: number;   // joint lower limit (rad)
  max: number;   // joint upper limit (rad)
  name: string;  // joint name
}

export interface RobotDef {
  id: RobotModelId;
  name: string;
  tagline: string;
  dof: number;
  reachMm: number;
  payloadKg: number;
  dh: DHRow[];
  linkColors: string[];
  jointColors: string[];
  baseHeight: number;
  baseRadius: number;
}

export interface CartesianPose {
  x: number;     // meters
  y: number;
  z: number;
  roll: number;  // radians
  pitch: number;
  yaw: number;
  matrix: number[][]; // 4x4 homogenous matrix
}

export interface LessonSection {
  title: string;
  body: string; // Markdown / HTML text
}

export interface LessonConfig {
  presetAngles?: number[]; // in degrees
  showFrames?: boolean;
  showDHOverlay?: boolean;
  showTrace?: boolean;
  highlightJoint?: number;
}

export interface Lesson {
  id: string;
  title: string;
  chapter: 'Fundamentals' | 'Kinematics' | 'Dynamics & Motion' | 'Programming & Safety';
  icon: string;
  config: LessonConfig;
  sections: LessonSection[];
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'box' | 'cylinder' | 'sphere';
  position: [number, number, number]; // [x, y, z] in Three.js world space
  size: [number, number, number];
  color: string;
  isHeld: boolean;
  velocity: [number, number, number];
}

export interface PenStrokePoint {
  x: number; // UV coordinate [0..1] on whiteboard
  y: number; // UV coordinate [0..1] on whiteboard
  color: string;
  width: number;
  isNewStroke?: boolean;
}

export interface SimulationLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface CodeTemplate {
  id: string;
  title: string;
  language: 'python' | 'javascript';
  code: string;
  description: string;
}

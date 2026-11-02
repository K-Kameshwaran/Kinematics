/**
 * Kinematics - Code Templates for Simulate & Draw Modes
 * Supports python-urx API emulation and JavaScript continuous control.
 */

import { CodeTemplate } from './types';

export const SIMULATION_TEMPLATES: CodeTemplate[] = [
  {
    id: 'py_pick_place',
    title: 'Pick & Place Routine (python-urx)',
    language: 'python',
    description: 'Autonomous pick and place cycle with gripper control and waypoint transitions.',
    code: `# Kinematics - Pick and Place Routine
import urx

rob = urx.Robot("192.168.1.100")

# 1. Move to home position
rob.movej([0, -1.57, 1.57, -1.57, -1.57, 0], a=1.0, v=0.5)
rob.gripper.move(100) # Open gripper

# 2. Hover above pickup block
rob.movej([0.35, -1.25, 2.10, -2.42, -1.57, 0.35], a=0.8, v=0.4)

# 3. Lower down to grasp object
rob.movej([0.35, -1.42, 2.40, -2.55, -1.57, 0.35], a=0.3, v=0.15)
rob.gripper.move(0) # Close gripper on block

# 4. Lift block up
rob.movej([0.35, -1.25, 2.10, -2.42, -1.57, 0.35], a=0.5, v=0.3)

# 5. Move across table to drop location
rob.movej([2.10, -1.25, 2.10, -2.42, -1.57, 0], a=0.8, v=0.4)

# 6. Lower down and release
rob.movej([2.10, -1.42, 2.40, -2.55, -1.57, 0], a=0.3, v=0.15)
rob.gripper.move(100) # Release

# 7. Return to safe home
rob.movej([0, -1.57, 1.57, -1.57, -1.57, 0], a=1.0, v=0.5)
`,
  },
  {
    id: 'py_reach_test',
    title: 'Workspace Reachability Sweep (python-urx)',
    language: 'python',
    description: 'Exercises all 6 degrees of freedom through cardinal workspace limits.',
    code: `# Kinematics - Full Workspace Reachability Sweep
import urx

rob = urx.Robot("192.168.1.100")

# Home pose
rob.movej([0, -1.57, 1.57, -1.57, -1.57, 0], a=1.0, v=0.6)

# Pan base 90 deg clockwise
rob.movej([1.57, -1.57, 1.57, -1.57, -1.57, 0], a=0.8, v=0.5)

# Reach upward
rob.movej([1.57, -2.0, 0.8, -0.37, -1.57, 0], a=0.6, v=0.4)

# Pan base 90 deg counter-clockwise
rob.movej([-1.57, -2.0, 0.8, -0.37, -1.57, 0], a=0.8, v=0.5)

# Forward reach
rob.movej([-1.57, -0.9, 1.9, -2.57, -1.57, 0], a=0.7, v=0.4)

# Back to Home
rob.movej([0, -1.57, 1.57, -1.57, -1.57, 0], a=1.0, v=0.6)
`,
  },
  {
    id: 'js_wave',
    title: 'Sinusoidal Wave (JavaScript)',
    language: 'javascript',
    description: 'Continuous smooth harmonic trajectory using update(t).',
    code: `// Kinematics - Continuous Harmonic Motion Control
// Called every frame with time 't' in seconds
function update(t) {
  const q1 = Math.sin(t * 1.2) * 0.6;
  const q2 = -1.57 + Math.sin(t * 1.5) * 0.3;
  const q3 = 1.57 + Math.cos(t * 1.5) * 0.4;
  const q4 = -1.57 + Math.sin(t * 1.8) * 0.2;
  const q5 = -1.57;
  const q6 = t * 1.0;

  return [q1, q2, q3, q4, q5, q6];
}
`,
  },
  {
    id: 'js_circle_tracer',
    title: 'Circle Tracer (JavaScript)',
    language: 'javascript',
    description: 'Continuous circular path tracer in Cartesian workspace.',
    code: `// Kinematics - Continuous Cartesian Circle Sweep
function update(t) {
  const speed = 1.5;
  const angle = t * speed;
  const r = 0.25;

  // Joint harmonics to create planar sweep
  const q1 = Math.atan2(Math.sin(angle) * r, 0.6);
  const q2 = -1.35 + Math.cos(angle) * 0.2;
  const q3 = 1.8 + Math.sin(angle) * 0.25;
  const q4 = -2.0 - Math.cos(angle) * 0.15;
  const q5 = -1.57;
  const q6 = 0;

  return [q1, q2, q3, q4, q5, q6];
}
`,
  },
];

export const DRAWING_TEMPLATES: CodeTemplate[] = [
  {
    id: 'draw_hi',
    title: 'Draw "Hi" (Caltech Demo)',
    language: 'python',
    description: 'Exact Cartesian whiteboard drawing routine from the Caltech project demonstration.',
    code: `# Kinematics Lab Demo: Write "Hi" on Whiteboard
# Uses Cartesian draw_to(x, y) with Levenberg-Marquardt IK

pen_color("#00D4AA")
pen_width(4)

# Letter 'H' - Left vertical stem
pen_up()
draw_to(0.28, 0.20)
pen_down()
draw_to(0.28, 0.80)

# 'H' - Crossbar
pen_up()
draw_to(0.28, 0.50)
pen_down()
draw_to(0.48, 0.50)

# 'H' - Right vertical stem
pen_up()
draw_to(0.48, 0.80)
pen_down()
draw_to(0.48, 0.20)

# Letter 'i' - Vertical stem
pen_up()
draw_to(0.66, 0.20)
pen_down()
draw_to(0.66, 0.60)

# 'i' - Dot
pen_up()
draw_to(0.66, 0.76)
pen_down()
draw_to(0.66, 0.78)

# Retract pen and return
pen_up()
draw_to(0.50, 0.90)
`,
  },
  {
    id: 'draw_star',
    title: 'Draw Geometric Star',
    language: 'python',
    description: 'Cartesian five-pointed geometric star using exact coordinate vectors.',
    code: `# Kinematics - 5-Pointed Star
pen_color("#F59E0B")
pen_width(3)

pen_up()
draw_to(0.50, 0.85) # Top peak
pen_down()
draw_to(0.61, 0.30) # Bottom right
draw_to(0.20, 0.62) # Top left
draw_to(0.80, 0.62) # Top right
draw_to(0.39, 0.30) # Bottom left
draw_to(0.50, 0.85) # Close star

pen_up()
draw_to(0.50, 0.95)
`,
  },
  {
    id: 'draw_spiral',
    title: 'Draw Archimedean Spiral',
    language: 'python',
    description: 'Smooth multi-turn Archimedean spiral solved with numerical IK.',
    code: `# Kinematics - Archimedean Spiral
pen_color("#38BDF8")
pen_width(3)

pen_up()
draw_to(0.50, 0.50)
pen_down()

# Multi-turn spiral
turns = 3.0
points = 60
for i in range(1, points + 1):
    t = i / points
    angle = t * turns * 6.28318
    radius = t * 0.32
    x = 0.50 + radius * math.cos(angle)
    y = 0.50 + radius * math.sin(angle)
    draw_to(x, y)

pen_up()
draw_to(0.50, 0.90)
`,
  },
  {
    id: 'draw_circle',
    title: 'Draw Precision Circle',
    language: 'python',
    description: 'Circle inscribed on the whiteboard surface with 36 Cartesian waypoints.',
    code: `# Kinematics - Precision Circle
pen_color("#EC4899")
pen_width(4)

pen_up()
draw_to(0.75, 0.50)
pen_down()

steps = 36
for i in range(1, steps + 1):
    theta = (i / steps) * 6.28318
    x = 0.50 + 0.25 * math.cos(theta)
    y = 0.50 + 0.25 * math.sin(theta)
    draw_to(x, y)

pen_up()
draw_to(0.50, 0.90)
`,
  },
];

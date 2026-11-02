/**
 * Kinematics - Educational Lessons & Chapters
 * Authored for Caltech ME/CDS/EE 235a Advanced Robotics
 */

import { Lesson } from './types';

export const LESSONS: Lesson[] = [
  // ── Chapter 1: Fundamentals ──────────────────────────────────
  {
    id: 'frames',
    title: 'Coordinate Frames & Conventions',
    chapter: 'Fundamentals',
    icon: '🧭',
    config: {
      presetAngles: [0, -90, 90, -90, -90, 0],
      showFrames: true,
      showDHOverlay: false,
      showTrace: false,
    },
    sections: [
      {
        title: 'Reference Frames in Robotics',
        body: `Every link and actuator in a robotic arm possesses its own local coordinate frame. In three dimensions, a frame consists of an origin point $O$ and three mutually orthogonal unit vectors $(\\hat{x}, \\hat{y}, \\hat{z})$ obeying the right-hand rule.

In **Kinematics**, RGB color convention is strictly maintained:
- **Red**: $\\hat{x}$-axis
- **Green**: $\\hat{y}$-axis
- **Blue**: $\\hat{z}$-axis (aligned with the joint rotation axis)`,
      },
      {
        title: 'Base Frame vs. Tool Frame',
        body: `Frame {0} is firmly attached to the stationary robot base pedestal and does not move. Frame {6} (or {n} for n-DOF arms) is attached to the end-effector tool flange.

Understanding the spatial mapping between base coordinates and tool coordinates is the cornerstone of robotic manipulation.`,
      },
    ],
  },
  {
    id: 'transforms',
    title: 'Rigid Body Transformations',
    chapter: 'Fundamentals',
    icon: '🔄',
    config: {
      presetAngles: [30, -60, 60, -90, -90, 45],
      showFrames: true,
      showDHOverlay: false,
      showTrace: true,
    },
    sections: [
      {
        title: 'Homogeneous Transformation Matrices',
        body: `A spatial pose is represented as a $4 \\times 4$ homogeneous matrix:

$$T = \\begin{bmatrix} R & p \\\\ 0 & 1 \\end{bmatrix} = \\begin{bmatrix} r_{11} & r_{12} & r_{13} & x \\\\ r_{21} & r_{22} & r_{23} & y \\\\ r_{31} & r_{32} & r_{33} & z \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$$

Where $R \\in SO(3)$ is an orthonormal rotation matrix and $p = [x, y, z]^T \\in \\mathbb{R}^3$ is the translation vector.`,
      },
      {
        title: 'Matrix Chaining',
        body: `To find the pose of frame 3 relative to the base, we chain individual transformations:

$$T_0^3 = T_0^1 \\cdot T_1^2 \\cdot T_2^3$$

Matrix multiplication is associative but non-commutative ($A \\cdot B \\neq B \\cdot A$). The order of rotations matters!`,
      },
    ],
  },

  // ── Chapter 2: Kinematics ────────────────────────────────────
  {
    id: 'dh_params',
    title: 'Denavit–Hartenberg Parameters',
    chapter: 'Kinematics',
    icon: '📐',
    config: {
      presetAngles: [30, -60, 45, -75, -90, 20],
      showFrames: true,
      showDHOverlay: true,
      showTrace: false,
    },
    sections: [
      {
        title: 'The 4 Classical DH Parameters',
        body: `The Denavit–Hartenberg (DH) convention uses only **four parameters** per link to describe any open kinematic chain:

1. **$\\theta_i$ (Joint Angle)**: Rotation about $z_{i-1}$ from $x_{i-1}$ to $x_i$
2. **$d_i$ (Link Offset)**: Distance along $z_{i-1}$ from origin $O_{i-1}$ to the intersection with $x_i$
3. **$a_i$ (Link Length)**: Distance along $x_i$ from $z_{i-1}$ to $z_i$ (shortest perpendicular distance)
4. **$\\alpha_i$ (Link Twist)**: Rotation about $x_i$ from $z_{i-1}$ to $z_i$`,
      },
      {
        title: 'Individual Link Transformation',
        body: `Each link matrix $T_i$ is computed as:

$$T_i = \\text{Rot}_z(\\theta_i) \\cdot \\text{Trans}_z(d_i) \\cdot \\text{Trans}_x(a_i) \\cdot \\text{Rot}_x(\\alpha_i)$$

Click the **DH Table** button in the header at any time to inspect the exact parameters for Universal Robots UR10e, UR5e, and UR3e arms.`,
      },
    ],
  },
  {
    id: 'fk',
    title: 'Forward Kinematics (FK)',
    chapter: 'Kinematics',
    icon: '🦾',
    config: {
      presetAngles: [0, -90, 90, -90, -90, 0],
      showFrames: true,
      showDHOverlay: false,
      showTrace: true,
    },
    sections: [
      {
        title: 'Computing End-Effector Position',
        body: `Forward kinematics answers the question: *Given joint angles $\\mathbf{q} = [\\theta_1, \\theta_2, \\dots, \\theta_n]^T$, where is the end-effector in Cartesian space?*

$$T_0^n(\\mathbf{q}) = \\prod_{i=1}^n T_{i-1}^i(\\theta_i)$$

FK is single-valued and computationally deterministic: every set of joint angles maps to exactly one unique Cartesian pose.`,
      },
      {
        title: 'Try It in Play Mode',
        body: `Switch to **Play Mode** and adjust any joint slider. Watch the real-time $4 \\times 4$ matrix update simultaneously alongside the Cartesian XYZ position and Roll/Pitch/Yaw orientation!`,
      },
    ],
  },
  {
    id: 'ik',
    title: 'Inverse Kinematics (IK)',
    chapter: 'Kinematics',
    icon: '🎯',
    config: {
      presetAngles: [45, -70, 75, -95, -90, 0],
      showFrames: true,
      showDHOverlay: false,
      showTrace: true,
    },
    sections: [
      {
        title: 'The Challenge of IK',
        body: `Inverse kinematics solves the reverse: *Given desired position $\\mathbf{x}^* \\in \\mathbb{R}^3$ and orientation $R^* \\in SO(3)$, what joint angles $\\mathbf{q}$ reach it?*

Unlike FK, IK is:
- **Non-linear**: Contains trigonometric transcendental equations
- **Multi-solution**: A 6-DOF arm like the UR5e typically has up to **8 discrete inverse solutions** (shoulder left/right, elbow up/down, wrist flip/no-flip)
- **Singular**: In certain poses (e.g. fully stretched or overhead wrist alignment), infinite or zero solutions exist`,
      },
      {
        title: 'Analytical vs. Numerical Methods',
        body: `Piez-type arms with spherical wrists allow closed-form analytical decoupling. For generic arms and trajectory tracking, numerical iterative algorithms (such as Levenberg–Marquardt DLS) are preferred.`,
      },
    ],
  },

  // ── Chapter 3: Dynamics & Motion Control ────────────────────
  {
    id: 'velocity_jacobian',
    title: 'Velocity Kinematics & Jacobians',
    chapter: 'Dynamics & Motion',
    icon: '⚡',
    config: {
      presetAngles: [0, -75, 80, -95, -90, 0],
      showFrames: true,
      showDHOverlay: false,
      showTrace: true,
    },
    sections: [
      {
        title: 'The Geometric Jacobian',
        body: `The Jacobian matrix $J(\\mathbf{q}) \\in \\mathbb{R}^{6 \\times n}$ linearly maps joint angular velocities $\\dot{\\mathbf{q}}$ to end-effector linear and angular velocities $\\mathbf{v}$:

$$\\mathbf{v} = \\begin{bmatrix} \\dot{\\mathbf{p}} \\\\ \\boldsymbol{\\omega} \\end{bmatrix} = J(\\mathbf{q}) \\, \\dot{\\mathbf{q}}$$

For a revolute joint $i$:
$$J_i = \\begin{bmatrix} \\hat{z}_{i-1} \\times (\\mathbf{p}_e - \\mathbf{p}_{i-1}) \\\\ \\hat{z}_{i-1} \\end{bmatrix}$$`,
      },
      {
        title: 'Kinematic Singularities',
        body: `When $\\det(J(\\mathbf{q})) = 0$, the robot loses one or more degrees of freedom in Cartesian space. Moving in the singular direction would require infinite joint velocities.`,
      },
    ],
  },
  {
    id: 'trajectory_planning',
    title: 'Trajectory Planning & Interpolation',
    chapter: 'Dynamics & Motion',
    icon: '📈',
    config: {
      presetAngles: [15, -60, 70, -100, -90, 15],
      showFrames: false,
      showDHOverlay: false,
      showTrace: true,
    },
    sections: [
      {
        title: 'Joint Space vs. Cartesian Space Motion',
        body: `In robotics, two primary motion interpolation modes exist:

1. **\`movej\` (Joint-Space Motion)**:
   Interpolates joint angles $\\mathbf{q}(t)$ linearly or with trapezoidal velocity profiles. The end-effector follows a curved arc through 3D space, but joint limits and velocity bounds are easily respected.

2. **\`movel\` (Cartesian-Space Straight-Line)**:
   The tool tip follows a perfectly straight line from point $A$ to point $B$ in XYZ space. Requires continuous real-time IK solving at every time step.`,
      },
      {
        title: 'Why Lines Curve Without IK',
        body: `If you try to draw a straight line by simply changing one joint angle, the tip sweeps a circular arc. Pure straight lines on a whiteboard require coordinated multi-joint continuous adjustment.`,
      },
    ],
  },
  {
    id: 'cartesian_ik_drawing',
    title: 'Cartesian Straight Lines & Levenberg–Marquardt IK',
    chapter: 'Dynamics & Motion',
    icon: '✏️',
    config: {
      presetAngles: [0, -85, 135, -140, -90, 0],
      showFrames: true,
      showDHOverlay: false,
      showTrace: true,
    },
    sections: [
      {
        title: 'Damped Least-Squares (Levenberg–Marquardt)',
        body: `Standard pseudo-inverse $J^+$ can become unstable near singularities ($J J^T$ determinant approaches zero). The Damped Least-Squares formulation adds a damping factor $\\lambda$:

$$\\Delta \\mathbf{q} = J^T (J J^T + \\lambda^2 I)^{-1} \\, \\mathbf{e}$$

Where $\\mathbf{e} = \\mathbf{x}_{target} - \\mathbf{x}_{current}$. This guarantees robust convergence without violent joint jumps.`,
      },
      {
        title: 'Tool-Down Constraint for Whiteboard Drawing',
        body: `In **Draw Mode**, the simulator enforces that the marker remains perpendicular to the whiteboard:
1. Target UV coordinates on the board convert to 3D world space
2. 10 interpolation sub-steps per stroke ensure clean straight edges
3. Pen draws on contact with the whiteboard plane`,
      },
    ],
  },

  // ── Chapter 4: Programming & Safety ─────────────────────────
  {
    id: 'python_urx',
    title: 'python-urx API & Scripting',
    chapter: 'Programming & Safety',
    icon: '🐍',
    config: {
      presetAngles: [0, -90, 90, -90, -90, 0],
      showFrames: false,
      showDHOverlay: false,
      showTrace: true,
    },
    sections: [
      {
        title: 'Direct Hardware Transfer',
        body: `**Kinematics** emulates the standard open-source \`python-urx\` library used in industrial and academic labs worldwide. Scripts written in the simulator can transfer directly to real UR10e/UR5e hardware:

\`\`\`python
import urx
rob = urx.Robot("192.168.1.100")

# Move in joint space (radians, accel, velocity)
rob.movej([0, -1.57, 1.57, -1.57, -1.57, 0], a=1.0, v=0.5)

# Control parallel gripper
rob.gripper.move(0)   # Close
rob.gripper.move(100) # Open
\`\`\``,
      },
      {
        title: 'Simulate Mode Console',
        body: `Switch to **Simulate Mode** to run python-urx scripts with step-by-step execution, speed multiplier, pause/resume, and live console logging.`,
      },
    ],
  },
  {
    id: 'draw_lab',
    title: 'Whiteboard Drawing Laboratory',
    chapter: 'Programming & Safety',
    icon: '🎨',
    config: {
      presetAngles: [0, -80, 130, -140, -90, 0],
      showFrames: false,
      showDHOverlay: false,
      showTrace: false,
    },
    sections: [
      {
        title: 'Robotic Pen & Board Simulation',
        body: `In **Draw Mode**, the robot arm holds a dry-erase pen. The whiteboard has a high-resolution dynamic raster surface ($840 \\times 600$ pixels). When the pen tip touches within contact distance of the board, pixels are rendered in real-time.`,
      },
      {
        title: 'The \`draw_to(x, y)\` Primitive',
        body: `Cartesian drawing helper:
\`\`\`python
# Coordinates range from [0, 0] bottom-left to [1, 1] top-right
pen_down()
draw_to(0.3, 0.2)
draw_to(0.3, 0.8)
pen_up()
\`\`\`
Try loading the **Draw "Hi"** or **Draw Star** template in the Draw panel to watch the Caltech project drawing in action!`,
      },
    ],
  },
  {
    id: 'safety_collisions',
    title: 'Industrial Safety & Collision Detection',
    chapter: 'Programming & Safety',
    icon: '🛡️',
    config: {
      presetAngles: [0, -30, 45, -100, -90, 0],
      showFrames: true,
      showDHOverlay: false,
      showTrace: false,
    },
    sections: [
      {
        title: 'Collaborative Robot Safety Standards',
        body: `ISO/TS 15066 defines safety specifications for collaborative industrial robots:
1. **Power & Force Limiting**: Cobots stop upon unexpected physical contact
2. **Speed & Separation Monitoring**: Reducing speed when obstacles enter proximity
3. **Workspace Envelopes**: Ensuring links do not breach floor, table, or wall bounds`,
      },
      {
        title: 'Self-Collision in Simulation',
        body: `The simulator continuously calculates bounding spheres and line-segment proximity between non-adjacent robot links and floor/table planes, immediately alerting with visual HUD cues when safety margins are breached.`,
      },
    ],
  },
];

# Kinematics

> An interactive 3D robotic manipulator simulator and educational laboratory for forward and inverse kinematics, Denavit–Hartenberg parameterization, trajectory planning, and numerical Cartesian whiteboard drawing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r128+-black?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## Overview

**Kinematics** is a modern, web-native 3D robotics simulator and spatial kinematics workbench. It brings industrial robot arm physics, forward and inverse kinematics, velocity Jacobians, and python-urx hardware API emulation into an interactive, zero-installation browser application.

The project models the official Universal Robots collaborative arms (**UR10e, UR5e, and UR3e**) as well as simplified educational models (**2-DOF Planar and 3-DOF Spatial**) using standard classical Denavit–Hartenberg (DH) parameterization. An integrated Levenberg–Marquardt damped least-squares (DLS) numerical inverse kinematics solver allows arms to draw straight Cartesian vectors and intricate shapes on an interactive 3D whiteboard with tool-down orientation constraints.

---

## Problem Statement

Understanding multi-axis robotic manipulation requires mastering abstract spatial mathematics: $4 \times 4$ homogeneous transformation matrices, reference frame transformations, trigonometric joint couplings, kinematic singularities, and Jacobian-based velocity mapping.

Historically, students and engineers faced significant hurdles:
- **Steep Tooling Barrier**: Traditional tools (e.g., ROS, MoveIt, Gazebo, MATLAB Robotics System Toolbox) require gigabytes of dependencies, Linux virtual machines, or expensive commercial licenses.
- **Disconnection from Theory**: Textbook matrix equations are static, making it difficult to intuitively grasp how non-commuting rotation matrices ($A \cdot B \neq B \cdot A$) manifest in physical 3D link orientations.
- **Hardware Disconnect**: Educational toy models rarely mirror real industrial robot conventions, meaning control algorithms cannot transfer to real collaborative hardware.

---

## Project Objectives

1. **Zero-Installation Accessibility**: Run entirely in any modern web browser with hardware-accelerated 3D WebGL rendering at 60 FPS.
2. **Mathematical Authenticity**: Implement rigorous standard Denavit–Hartenberg parameterization and real-time transformation matrix calculations matching manufacturer documentation.
3. **Multi-Mode Learning Experience**: Provide progressive discovery across four core operating modes:
   - **Learn Mode**: Structured interactive curriculum across 11 lessons and 4 chapters.
   - **Play Mode**: Direct joint and Cartesian control with real-time pose decomposition and pick-and-place physics.
   - **Simulate Mode**: Code editor running automated python-urx scripts and continuous JavaScript control loops.
   - **Draw Mode**: Whiteboard laboratory solving straight-line Cartesian paths via Levenberg–Marquardt numerical IK.
4. **Hardware Transferability**: Emulate the `python-urx` API (`rob.movej`, `rob.movel`, `rob.gripper.move`, `time.sleep`) so scripts written in the simulator translate directly to physical Universal Robots controllers.
5. **Academic Archival**: Provide embedded access to the technical project report and demonstration videos.

---

## Key Features

- **Accurate Robot Models**:
  - **UR10e**: 6-DOF industrial arm, 1300 mm reach, 12.5 kg payload.
  - **UR5e**: 6-DOF versatile cobot, 850 mm reach, 5.0 kg payload.
  - **UR3e**: 6-DOF tabletop arm, 500 mm reach, 3.0 kg payload.
  - **2-DOF Planar**: Two-link educational arm for workspace boundary analysis.
  - **3-DOF Spatial**: Three-link spatial model for 3D positioning fundamentals.
- **Interactive 3D Viewport**:
  - Physically-based rendering (PBR) with soft shadows, studio lighting, and studio reflections.
  - Color-coded coordinate frame triads at every joint (Red $= X$, Green $= Y$, Blue $= Z$).
  - Smooth camera orbit, zoom, pan, and one-click perspective presets (Home, Top, Front, Side, Whiteboard).
  - Real-time trajectory trail recording and collision envelope warnings.
- **Whiteboard Drawing Laboratory**:
  - Robot holds a pen and draws on a simulated dry-erase whiteboard.
  - Damped least-squares (Levenberg–Marquardt) numerical IK engine for straight Cartesian strokes.
  - Tool-down orientation constraints prevent marker skewing.
  - Color selection, stroke width adjustment, clear board, and real-time mini-canvas preview.
- **Tabletop Rigid-Body Physics**:
  - Graspable cubes, cylinders, and spheres resting on an industrial workbench.
  - Numerical physics integration handling gravity ($-9.81\,\text{m/s}^2$), collision detection, bounce restitution, and surface friction.
  - Two-finger parallel jaw gripper with proximity grasp latching.
- **Dual Scripting Engines**:
  - **python-urx Interpreter**: Supports sequential robot moves, gripper commands, and drawing primitives.
  - **JavaScript Continuous Controller**: Supports mathematical continuous velocity functions: `update(t)`.
  - Line-by-line syntax highlight, execution speed multiplier ($0.25\times$ to $2.0\times$), single-step execution, and live terminal console.
- **Interactive DH Parameter Inspector**:
  - Pop-up inspector detailing $(\theta_i, d_i, a_i, \alpha_i)$, joint limits, and live angular values.
  - Clear mathematical explanations of common normals and link twists.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            App Navigation Header                            │
│  [Logo: KINEMATICS]       [Modes: Learn | Play | Simulate | Draw | Media]   │
│  [Robot: UR10e/UR5e/UR3e] [DH Table]  [Frames]  [Trace]  [Reset Pose]       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
┌───────────────▼───────────────────────────┐   ┌─────────────▼───────────────┐
│        Three.js 3D Viewport Stage         │   │   Responsive Control Deck   │
│  ┌─────────────────────────────────────┐  │   │  ┌───────────────────────┐  │
│  │ Procedural PBR Robot Manipulator    │  │   │  │ Mode Panels:          │  │
│  │  - Kinematic Link Mesh Generation   │  │   │  │  - Learn (11 Lessons) │  │
│  │  - Joint Coordinate Frame Triads    │  │   │  │  - Play (Sliders/FK)  │  │
│  │  - Parallel Jaw Gripper & Pen Tool  │  │   │  │  - Sim (Python-urx)   │  │
│  │  - Dynamic 2D/3D Whiteboard Canvas  │  │   │  │  - Draw Lab (LM IK)   │  │
│  │  - Rigid-Body Physics Objects       │  │   │  │  - Project Report PDF │  │
│  │  - End-Effector Motion Trail (Line) │  │   │  │  - Demo Video Player  │  │
│  │  - Telemetry HUD & Safety Alerts    │  │   │  └───────────────────────┘  │
│  └─────────────────────────────────────┘  │   │  ┌───────────────────────┐  │
│  [OrbitControls, Studio Lighting, Cam]    │   │  │ Editor & Terminal Log │  │
└───────────────────────────────────────────┘   │  │ - Python / JS Syntax  │  │
                                                │  │ - Error Highlights    │  │
                                                │  │ - Execution Telemetry │  │
                                                │  └───────────────────────┘  │
                                                └─────────────────────────────┘
```

---

## How It Works

### 1. Denavit–Hartenberg Forward Kinematics

Each link's relative spatial transformation is represented as a homogeneous matrix:

$$T_i = \text{Rot}_z(\theta_i) \cdot \text{Trans}_z(d_i) \cdot \text{Trans}_x(a_i) \cdot \text{Rot}_x(\alpha_i)$$

$$\begin{bmatrix}
\cos\theta_i & -\sin\theta_i\cos\alpha_i & \sin\theta_i\sin\alpha_i & a_i\cos\theta_i \\
\sin\theta_i & \cos\theta_i\cos\alpha_i & -\cos\theta_i\sin\alpha_i & a_i\sin\theta_i \\
0 & \sin\alpha_i & \cos\alpha_i & d_i \\
0 & 0 & 0 & 1
\end{bmatrix}$$

Multiplying individual link matrices yields the cumulative transformation from base to end-effector:

$$T_0^n(\mathbf{q}) = \prod_{i=1}^n T_{i-1}^i(\theta_i)$$

### 2. Levenberg–Marquardt Numerical Inverse Kinematics

For Cartesian straight-line motions (e.g. whiteboard drawing), the simulator numerically computes the position Jacobian $J(\mathbf{q}) \in \mathbb{R}^{3 \times n}$ and updates joint angles via Damped Least Squares:

$$\Delta \mathbf{q} = J^T \left( J J^T + \lambda^2 I \right)^{-1} \mathbf{e}$$

Where:
- $\mathbf{e} = \mathbf{x}_{\text{target}} - \mathbf{x}_{\text{current}}$ is the position error vector
- $\lambda$ is the damping coefficient (prevents instability near kinematic singularities)
- Each straight line segment is subdivided into 10 interpolation sub-steps to ensure line linearity on the whiteboard plane.

### 3. Coordinate System Mapping

Robot kinematics traditionally follows right-handed conventions where the base $Z$-axis points upward. In Three.js, $Y$ points upward. The mapping is rigorously computed:

$$\begin{aligned}
X_{\text{Three}} &= X_{\text{DH}} \\
Y_{\text{Three}} &= Z_{\text{DH}} \\
Z_{\text{Three}} &= -Y_{\text{DH}}
\end{aligned}$$

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Build & Dev Tool** | [Vite 8](https://vitejs.dev/) |
| **3D Rendering** | [Three.js](https://threejs.org/) (r128+), PBR Shaders, OrbitControls, RoomEnvironment |
| **Styling & UI** | [Tailwind CSS 4](https://tailwindcss.com/), Lucide Icons |
| **Physics & Math** | Custom Matrix4, DH Forward Kinematics, Damped Least-Squares Numerical IK Engine |
| **Animations** | [Motion](https://motion.dev/) |

---

## Project Structure

```
.
├── index.html                  # HTML entry point with metadata and typography
├── metadata.json               # Application capabilities & AI Studio configuration
├── package.json                # Dependencies and npm build scripts
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite configuration with Tailwind CSS plugin
├── public/
│   └── assets/
│       └── kinematics/         # Project Report PDF and Demo Video assets
└── src/
    ├── main.tsx                # Application bootstrap
    ├── index.css               # Tailwind CSS v4 setup and global font tokens
    ├── App.tsx                 # Main application state and loop coordinator
    ├── kinematics/             # Core robotics mathematics & engine modules
    │   ├── types.ts            # TypeScript interfaces and data models
    │   ├── robots.ts           # Authentic DH parameter tables for UR10e/UR5e/UR3e
    │   ├── dhMath.ts           # Matrix math, FK, Jacobian, Levenberg-Marquardt IK
    │   ├── lessons.ts          # 11 interactive lessons across 4 chapters
    │   ├── templates.ts        # python-urx and JavaScript code templates
    │   ├── physics.ts          # Tabletop rigid-body collision and grasping physics
    │   └── pythonUrxParser.ts  # python-urx script interpreter
    └── components/
        ├── Header.tsx          # Rebranded navigation bar and robot selector
        ├── DHTableModal.tsx    # Denavit-Hartenberg parameter table inspector
        ├── viewport/
        │   └── ThreeViewport.tsx # Three.js 3D canvas, robot mesh, whiteboard
        └── panels/
            ├── LearnPanel.tsx    # Curriculum reader with 3D auto-configuration
            ├── PlayPanel.tsx     # Joint sliders, FK matrix inspector, physics
            ├── SimulatePanel.tsx # Code editor, speed control, execution console
            ├── DrawPanel.tsx     # Whiteboard drawing lab with Cartesian LM IK
            ├── ReportPanel.tsx   # Project Report PDF viewer
            └── VideoPanel.tsx    # Demonstration video player
```

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- A modern web browser supporting **WebGL 2.0** (Chrome, Firefox, Safari, Edge)

---

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/kinematics.git
   cd kinematics
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify configuration**:
   ```bash
   cp .env.example .env.local # Optional: configure environment variables if needed
   ```

---

## Running the Project

### Development Server
Start the local Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Type Checking & Linting
Run the TypeScript compiler to verify zero type errors:
```bash
npm run lint
```

### Production Build
Compile and bundle the production assets:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## Usage Examples

### 1. Python-urx Pick and Place Routine
In **Simulate Mode**, paste the following script to execute an autonomous grasping routine:
```python
import urx

rob = urx.Robot("192.168.1.100")

# Move to home position
rob.movej([0, -1.57, 1.57, -1.57, -1.57, 0], a=1.0, v=0.5)
rob.gripper.move(100) # Open jaws

# Approach and grasp block
rob.movej([0.35, -1.25, 2.10, -2.42, -1.57, 0.35], a=0.8, v=0.4)
rob.movej([0.35, -1.42, 2.40, -2.55, -1.57, 0.35], a=0.3, v=0.15)
rob.gripper.move(0)   # Close jaws onto block

# Lift and translate to new location
rob.movej([0.35, -1.25, 2.10, -2.42, -1.57, 0.35], a=0.5, v=0.3)
rob.movej([2.10, -1.25, 2.10, -2.42, -1.57, 0], a=0.8, v=0.4)

# Release object
rob.movej([2.10, -1.42, 2.40, -2.55, -1.57, 0], a=0.3, v=0.15)
rob.gripper.move(100)

# Return home
rob.movej([0, -1.57, 1.57, -1.57, -1.57, 0], a=1.0, v=0.5)
```

### 2. Cartesian Whiteboard Drawing with Numerical IK
In **Draw Mode**, execute straight-line strokes on the 3D whiteboard:
```python
# Select pen styling
pen_color("#00D4AA")
pen_width(4)

# Draw letter 'H'
pen_up()
draw_to(0.28, 0.20)
pen_down()
draw_to(0.28, 0.80)

# Crossbar
pen_up()
draw_to(0.28, 0.50)
pen_down()
draw_to(0.48, 0.50)

# Right stem
pen_up()
draw_to(0.48, 0.80)
pen_down()
draw_to(0.48, 0.20)

# Letter 'i'
pen_up()
draw_to(0.66, 0.20)
pen_down()
draw_to(0.66, 0.60)

# Dot
pen_up()
draw_to(0.66, 0.76)
pen_down()
draw_to(0.66, 0.78)

pen_up()
draw_to(0.50, 0.90)
```

### 3. Continuous Harmonic Motion (JavaScript)
In **Simulate Mode**, select JavaScript to control all 6 axes smoothly every frame:
```javascript
function update(t) {
  const q1 = Math.sin(t * 1.2) * 0.6;
  const q2 = -1.57 + Math.sin(t * 1.5) * 0.3;
  const q3 = 1.57 + Math.cos(t * 1.5) * 0.4;
  const q4 = -1.57 + Math.sin(t * 1.8) * 0.2;
  const q5 = -1.57;
  const q6 = t * 1.0;

  return [q1, q2, q3, q4, q5, q6];
}
```

---

## Testing & Validation

The application undergoes rigorous static type-checking and automated build validation:
```bash
# 1. Type validation and linting
npm run lint

# 2. Production build verification
npm run build
```

Validation Checklist:
- [x] All Denavit–Hartenberg link transformations verified against UR documentation.
- [x] Forward kinematics frame origins verified to connect link end-to-end without discontinuity.
- [x] Levenberg–Marquardt DLS numerical inverse kinematics verified for convergence under 3mm position tolerance.
- [x] Tabletop rigid-body physics verified for gravity acceleration, plane collisions, and gripper latching.
- [x] 11 curriculum lessons with auto-configuration targets tested across all supported robot models.

---

## Limitations

- **Simplified Collision Geometry**: Self-collision detection uses bounding spheres and line-segment proximities rather than full GJK/EPA convex polyhedral meshes.
- **Tabletop Whiteboard Orientation**: The whiteboard is positioned in a fixed vertical orientation in front of the arm ($Z = 0.52\,\text{m}$); dynamic movable easel positioning is planned for a future release.
- **Python Syntax Scope**: The built-in python-urx parser focuses on the primary hardware movement, gripper, and timing methods; complex arbitrary Python packages (e.g. NumPy) should be compiled to JavaScript or tested via API bridge.

---

## Future Improvements

- [ ] **Dual-Arm Coordination**: Adding bimanual manipulation with two synchronized UR arms.
- [ ] **URDF / CAD Mesh Importer**: Allowing users to drag-and-drop custom `.urdf` or `.stl` robot definitions.
- [ ] **Real-Time WebSocket Robot Bridge**: Connecting the browser simulator directly to physical UR robot controller IP addresses via ROS bridge or TCP socket proxy.
- [ ] **Trajectory Export**: Exporting drawn whiteboard paths to G-code and industrial URScript `.script` files.

---

## Contributing

Contributions are welcomed! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/kinematic-enhancement`).
3. Commit your changes (`git commit -m "Add feature: analytical spherical wrist IK"`).
4. Verify tests and linting (`npm run lint && npm run build`).
5. Push to the branch (`git push origin feature/kinematic-enhancement`).
6. Open a Pull Request with a clear description of changes.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

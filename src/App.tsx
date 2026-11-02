/**
 * Kinematics - App.tsx
 * Main application coordinator orchestrating Three.js 3D viewport,
 * robotics forward/inverse kinematics, physics, execution loops, and panels.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppMode, RobotModelId, CartesianPose, SceneObject, PenStrokePoint, SimulationLog, LessonConfig } from './kinematics/types';
import { ROBOTS, INITIAL_JOINT_ANGLES } from './kinematics/robots';
import { getEndEffectorPose, solveLevenbergMarquardtIK } from './kinematics/dhMath';
import { INITIAL_SCENE_OBJECTS, stepPhysics } from './kinematics/physics';
import { parsePythonUrxScript, ScriptCommand } from './kinematics/pythonUrxParser';
import { SIMULATION_TEMPLATES, DRAWING_TEMPLATES } from './kinematics/templates';

import { Header } from './components/Header';
import { ThreeViewport, WHITEBOARD_CONFIG } from './components/viewport/ThreeViewport';
import { LearnPanel } from './components/panels/LearnPanel';
import { PlayPanel } from './components/panels/PlayPanel';
import { SimulatePanel } from './components/panels/SimulatePanel';
import { DrawPanel } from './components/panels/DrawPanel';
import { ReportPanel } from './components/panels/ReportPanel';
import { VideoPanel } from './components/panels/VideoPanel';
import { DHTableModal } from './components/DHTableModal';

export default function App() {
  // ── Mode & Robot Selection ──
  const [currentMode, setCurrentMode] = useState<AppMode>('draw');
  const [selectedRobotId, setSelectedRobotId] = useState<RobotModelId>('ur5e');
  const currentRobot = ROBOTS[selectedRobotId];

  // ── Kinematic State ──
  const [jointAngles, setJointAngles] = useState<number[]>(INITIAL_JOINT_ANGLES.ur5e);
  const [gripperOpenAmount, setGripperOpenAmount] = useState<number>(0.0); // 0 (closed) to 1 (open)

  // ── Visual Overlays ──
  const [showFrames, setShowFrames] = useState<boolean>(false);
  const [showTrace, setShowTrace] = useState<boolean>(true);
  const [isDHTableOpen, setIsDHTableOpen] = useState<boolean>(false);
  const [clearTraceCount, setClearTraceCount] = useState<number>(0);

  // ── Physics Scene Objects ──
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>(INITIAL_SCENE_OBJECTS);

  // ── Whiteboard Drawing State ──
  const [whiteboardPoints, setWhiteboardPoints] = useState<PenStrokePoint[]>([]);
  const [penColor, setPenColor] = useState<string>('#00D4AA');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [isPenDown, setIsPenDown] = useState<boolean>(false);
  const [drawScript, setDrawScript] = useState<string>(DRAWING_TEMPLATES[0].code);
  const [isDrawingRunning, setIsDrawingRunning] = useState<boolean>(false);

  // ── Simulation Engine State ──
  const [simCode, setSimCode] = useState<string>(SIMULATION_TEMPLATES[0].code);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [simLogs, setSimLogs] = useState<SimulationLog[]>([]);
  const [currentRunningLine, setCurrentRunningLine] = useState<number | undefined>(undefined);
  const [syntaxErrors, setSyntaxErrors] = useState<string[]>([]);

  // ── Current End-Effector Pose & Safety ──
  const currentPose: CartesianPose = getEndEffectorPose(currentRobot.dh, jointAngles);

  // Safety collision check
  const safetyAlert: string | null = (() => {
    if (currentPose.y < -0.01) {
      return 'Safety Warning: Tool flange is penetrating tabletop plane (Y < 0.0m)!';
    }
    // Check joint limit bounds
    for (let i = 0; i < currentRobot.dh.length; i++) {
      const q = jointAngles[i] ?? 0;
      const row = currentRobot.dh[i];
      if (q < row.min - 0.05 || q > row.max + 0.05) {
        return `Joint Limit Exceeded: ${row.name} at ${(q * 57.3).toFixed(1)}°`;
      }
    }
    return null;
  })();

  // ── Handle Robot Switch ──
  const handleRobotChange = (newRobotId: RobotModelId) => {
    setSelectedRobotId(newRobotId);
    const initialAngles = INITIAL_JOINT_ANGLES[newRobotId] || [0, 0, 0, 0, 0, 0];
    setJointAngles([...initialAngles]);
    addLog(`Switched active model to ${ROBOTS[newRobotId].name} (${ROBOTS[newRobotId].dof}-DOF)`, 'info');
  };

  // ── Reset to Home Pose ──
  const handleResetPose = () => {
    const initial = INITIAL_JOINT_ANGLES[selectedRobotId];
    setJointAngles([...initial]);
    setGripperOpenAmount(0.0);
    setClearTraceCount((c) => c + 1);
    addLog('Reset robot to home pose.', 'info');
  };

  // ── Logger Helper ──
  const addLog = (message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setSimLogs((prev) => [...prev.slice(-100), { timestamp, level, message }]);
  };

  // ── Physics Tick Loop ──
  useEffect(() => {
    const interval = setInterval(() => {
      setSceneObjects((prev) =>
        stepPhysics(
          prev,
          0.02,
          [currentPose.x, currentPose.y, currentPose.z],
          gripperOpenAmount
        )
      );
    }, 20);
    return () => clearInterval(interval);
  }, [currentPose.x, currentPose.y, currentPose.z, gripperOpenAmount]);

  // ── Learn Mode: Apply Lesson Config ──
  const handleApplyLessonConfig = (cfg: LessonConfig) => {
    if (cfg.presetAngles) {
      const rads = cfg.presetAngles.slice(0, currentRobot.dof).map((deg) => (deg * Math.PI) / 180);
      setJointAngles(rads);
    }
    if (cfg.showFrames !== undefined) setShowFrames(cfg.showFrames);
    if (cfg.showDHOverlay) setIsDHTableOpen(true);
    if (cfg.showTrace !== undefined) setShowTrace(cfg.showTrace);
  };

  // ── Simulation Runner Ref & State Machine ──
  const simRunnerRef = useRef<{
    commands: ScriptCommand[];
    cmdIndex: number;
    timer: any;
    startTime: number;
    isJsContinuous: boolean;
    jsFunc: ((t: number) => number[]) | null;
  }>({
    commands: [],
    cmdIndex: 0,
    timer: null,
    startTime: 0,
    isJsContinuous: false,
    jsFunc: null,
  });

  // Start Simulation
  const handleRunSimulation = () => {
    setSyntaxErrors([]);
    addLog('Parsing simulation script...', 'info');

    // Check if script is continuous JavaScript function update(t)
    if (simCode.includes('function update(')) {
      try {
        // eslint-disable-next-line no-new-func
        const compiled = new Function(`${simCode}; return update;`)();
        simRunnerRef.current.isJsContinuous = true;
        simRunnerRef.current.jsFunc = compiled;
        simRunnerRef.current.startTime = performance.now();
        setIsSimRunning(true);
        setIsSimPaused(false);
        addLog('Continuous JavaScript simulation running.', 'success');
        return;
      } catch (err: any) {
        setSyntaxErrors([err.message || 'JavaScript compilation error']);
        addLog(`JS Compile Error: ${err.message}`, 'error');
        return;
      }
    }

    // Otherwise, parse as python-urx commands
    const { commands, errors } = parsePythonUrxScript(simCode);
    if (errors.length > 0) {
      setSyntaxErrors(errors);
      errors.forEach((e) => addLog(e, 'error'));
      return;
    }

    if (commands.length === 0) {
      addLog('No executable commands found in script.', 'warn');
      return;
    }

    simRunnerRef.current.isJsContinuous = false;
    simRunnerRef.current.commands = commands;
    simRunnerRef.current.cmdIndex = 0;
    setIsSimRunning(true);
    setIsSimPaused(false);
    addLog(`Starting python-urx execution (${commands.length} commands)...`, 'success');
  };

  // Stop Simulation
  const handleStopSimulation = () => {
    setIsSimRunning(false);
    setIsSimPaused(false);
    setCurrentRunningLine(undefined);
    if (simRunnerRef.current.timer) {
      clearTimeout(simRunnerRef.current.timer);
    }
    addLog('Simulation stopped.', 'info');
  };

  // Single Step
  const handleStepSimulation = () => {
    if (!isSimRunning || !isSimPaused) return;
    executeNextSimCommand();
  };

  // Step execute one command
  const executeNextSimCommand = useCallback(() => {
    const runner = simRunnerRef.current;
    if (runner.cmdIndex >= runner.commands.length) {
      setIsSimRunning(false);
      setIsSimPaused(false);
      setCurrentRunningLine(undefined);
      addLog('Script execution complete.', 'success');
      return;
    }

    const cmd = runner.commands[runner.cmdIndex];
    runner.cmdIndex++;
    setCurrentRunningLine(cmd.lineNumber);

    switch (cmd.type) {
      case 'movej': {
        const targetAngles = (cmd.params.angles as number[]).slice(0, currentRobot.dof);
        setJointAngles([...targetAngles]);
        addLog(`Line ${cmd.lineNumber}: movej to [${targetAngles.map((a) => a.toFixed(2)).join(', ')}] rad`, 'info');
        break;
      }
      case 'gripper': {
        setGripperOpenAmount(cmd.params.openAmount);
        addLog(`Line ${cmd.lineNumber}: gripper.move(${Math.round(cmd.params.openAmount * 100)}%)`, 'info');
        break;
      }
      case 'sleep': {
        addLog(`Line ${cmd.lineNumber}: sleep(${cmd.params.duration}s)`, 'info');
        break;
      }
    }
  }, [currentRobot.dof]);

  // Simulation Tick Loop
  useEffect(() => {
    if (!isSimRunning || isSimPaused) return;

    // Continuous JS mode
    if (simRunnerRef.current.isJsContinuous && simRunnerRef.current.jsFunc) {
      const interval = setInterval(() => {
        const t = ((performance.now() - simRunnerRef.current.startTime) / 1000) * simSpeed;
        try {
          const resAngles = simRunnerRef.current.jsFunc!(t);
          if (Array.isArray(resAngles)) {
            setJointAngles(resAngles.slice(0, currentRobot.dof));
          }
        } catch (err: any) {
          handleStopSimulation();
          addLog(`Runtime error: ${err.message}`, 'error');
        }
      }, 30);
      return () => clearInterval(interval);
    }

    // Python-urx discrete commands mode
    const runner = simRunnerRef.current;
    const intervalTime = Math.max(200, 1000 / simSpeed);

    const timer = setTimeout(() => {
      executeNextSimCommand();
    }, intervalTime);

    runner.timer = timer;
    return () => clearTimeout(timer);
  }, [isSimRunning, isSimPaused, simSpeed, executeNextSimCommand, currentRobot.dof]);

  // ── Whiteboard Drawing Engine ──
  const drawRunnerRef = useRef<{
    commands: ScriptCommand[];
    cmdIndex: number;
    subStep: number;
    totalSubSteps: number;
    startUV: { x: number; y: number };
    targetUV: { x: number; y: number };
    curPenColor: string;
    curPenWidth: number;
    curIsPenDown: boolean;
    timer: any;
  }>({
    commands: [],
    cmdIndex: 0,
    subStep: 0,
    totalSubSteps: 10,
    startUV: { x: 0.5, y: 0.5 },
    targetUV: { x: 0.5, y: 0.5 },
    curPenColor: '#00D4AA',
    curPenWidth: 3,
    curIsPenDown: false,
    timer: null,
  });

  const handleStartDrawing = () => {
    const { commands, errors } = parsePythonUrxScript(drawScript);
    if (errors.length > 0) {
      alert(`Script Error:\n${errors.join('\n')}`);
      return;
    }

    drawRunnerRef.current = {
      commands,
      cmdIndex: 0,
      subStep: 0,
      totalSubSteps: 10,
      startUV: { x: 0.5, y: 0.5 },
      targetUV: { x: 0.5, y: 0.5 },
      curPenColor: penColor,
      curPenWidth: penWidth,
      curIsPenDown: false,
      timer: null,
    };

    setIsDrawingRunning(true);
    addLog(`Starting Whiteboard Robotic Drawing (${commands.length} primitives)...`, 'success');
  };

  const handleStopDrawing = () => {
    setIsDrawingRunning(false);
    if (drawRunnerRef.current.timer) {
      clearTimeout(drawRunnerRef.current.timer);
    }
    setIsPenDown(false);
    addLog('Drawing routine stopped.', 'info');
  };

  const handleClearWhiteboard = () => {
    setWhiteboardPoints([]);
    addLog('Whiteboard surface cleared.', 'info');
  };

  // Draw Step Execution Loop
  useEffect(() => {
    if (!isDrawingRunning) return;

    const runner = drawRunnerRef.current;

    const tick = () => {
      // If we are currently interpolating sub-steps between startUV and targetUV
      if (runner.subStep < runner.totalSubSteps) {
        runner.subStep++;
        const alpha = runner.subStep / runner.totalSubSteps;
        const currentU = runner.startUV.x + (runner.targetUV.x - runner.startUV.x) * alpha;
        const currentV = runner.startUV.y + (runner.targetUV.y - runner.startUV.y) * alpha;

        // Convert whiteboard UV (0..1) to 3D world space
        // Whiteboard center is [0, 0.45, 0.52], width 0.65, height 0.45, facing -Z
        const halfW = WHITEBOARD_CONFIG.width / 2;
        const halfH = WHITEBOARD_CONFIG.height / 2;
        const worldX = WHITEBOARD_CONFIG.center[0] - halfW + currentU * WHITEBOARD_CONFIG.width;
        const worldY = WHITEBOARD_CONFIG.center[1] - halfH + currentV * WHITEBOARD_CONFIG.height;
        const worldZ = WHITEBOARD_CONFIG.center[2]; // on the board plane

        // Execute Levenberg-Marquardt DLS numerical IK
        const ikResult = solveLevenbergMarquardtIK(
          currentRobot.dh,
          jointAngles,
          [worldX, worldY, worldZ]
        );

        setJointAngles([...ikResult.angles]);

        // If pen is down, record stroke point
        if (runner.curIsPenDown) {
          setWhiteboardPoints((prev) => [
            ...prev,
            {
              x: currentU,
              y: currentV,
              color: runner.curPenColor,
              width: runner.curPenWidth,
              isNewStroke: runner.subStep === 1,
            },
          ]);
        }

        runner.timer = setTimeout(tick, 30);
        return;
      }

      // Check next command
      if (runner.cmdIndex >= runner.commands.length) {
        setIsDrawingRunning(false);
        setIsPenDown(false);
        addLog('Whiteboard drawing complete!', 'success');
        return;
      }

      const cmd = runner.commands[runner.cmdIndex];
      runner.cmdIndex++;

      switch (cmd.type) {
        case 'draw_to': {
          runner.startUV = { ...runner.targetUV };
          runner.targetUV = {
            x: Math.max(0.05, Math.min(0.95, cmd.params.x)),
            y: Math.max(0.05, Math.min(0.95, cmd.params.y)),
          };
          runner.subStep = 0;
          runner.totalSubSteps = 10; // 10 smooth sub-steps per stroke
          runner.timer = setTimeout(tick, 20);
          break;
        }
        case 'pen_down': {
          runner.curIsPenDown = true;
          setIsPenDown(true);
          runner.timer = setTimeout(tick, 20);
          break;
        }
        case 'pen_up': {
          runner.curIsPenDown = false;
          setIsPenDown(false);
          runner.timer = setTimeout(tick, 20);
          break;
        }
        case 'pen_color': {
          runner.curPenColor = cmd.params.color;
          setPenColor(cmd.params.color);
          runner.timer = setTimeout(tick, 10);
          break;
        }
        case 'pen_width': {
          runner.curPenWidth = cmd.params.width;
          setPenWidth(cmd.params.width);
          runner.timer = setTimeout(tick, 10);
          break;
        }
        default: {
          runner.timer = setTimeout(tick, 20);
          break;
        }
      }
    };

    runner.timer = setTimeout(tick, 20);
    return () => clearTimeout(runner.timer);
  }, [isDrawingRunning, currentRobot.dh, jointAngles]);

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 overflow-hidden font-sans select-none">
      {/* 1. Rebranded Top Navigation Header */}
      <Header
        currentMode={currentMode}
        onChangeMode={setCurrentMode}
        selectedRobotId={selectedRobotId}
        onChangeRobot={handleRobotChange}
        showFrames={showFrames}
        onToggleFrames={() => setShowFrames((f) => !f)}
        showTrace={showTrace}
        onToggleTrace={() => setShowTrace((t) => !t)}
        onResetPose={handleResetPose}
        onOpenDHTable={() => setIsDHTableOpen(true)}
      />

      {/* 2. Main Workspace: 3D Viewport on Left + Mode Control Deck on Right */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Three.js 3D Viewport */}
        <div className="flex-1 relative h-full">
          <ThreeViewport
            robot={currentRobot}
            jointAngles={jointAngles}
            showFrames={showFrames}
            showTrace={showTrace}
            gripperOpenAmount={gripperOpenAmount}
            hasPenTool={currentMode === 'draw'}
            penColor={penColor}
            penWidth={penWidth}
            whiteboardPoints={whiteboardPoints}
            sceneObjects={sceneObjects}
            currentPose={currentPose}
            safetyAlert={safetyAlert}
            onClearTrace={() => setClearTraceCount((c) => c + 1)}
          />
        </div>

        {/* Right Side: Mode Control Deck Panel */}
        <aside className="w-[420px] h-full flex flex-col shrink-0 z-10 shadow-2xl">
          {currentMode === 'learn' && (
            <LearnPanel onApplyConfig={handleApplyLessonConfig} />
          )}

          {currentMode === 'play' && (
            <PlayPanel
              robot={currentRobot}
              jointAngles={jointAngles}
              onJointChange={(idx, rad) => {
                const next = [...jointAngles];
                next[idx] = rad;
                setJointAngles(next);
              }}
              onSetAllJoints={setJointAngles}
              currentPose={currentPose}
              gripperOpenAmount={gripperOpenAmount}
              onGripperChange={setGripperOpenAmount}
              sceneObjects={sceneObjects}
              onResetSceneObjects={() => setSceneObjects(INITIAL_SCENE_OBJECTS)}
            />
          )}

          {currentMode === 'simulate' && (
            <SimulatePanel
              code={simCode}
              onChangeCode={setSimCode}
              isRunning={isSimRunning}
              isPaused={isSimPaused}
              onRun={handleRunSimulation}
              onPause={() => setIsSimPaused(true)}
              onStep={handleStepSimulation}
              onStop={handleStopSimulation}
              speedMultiplier={simSpeed}
              onChangeSpeed={setSimSpeed}
              logs={simLogs}
              onClearLogs={() => setSimLogs([])}
              currentRunningLine={currentRunningLine}
              syntaxErrors={syntaxErrors}
            />
          )}

          {currentMode === 'draw' && (
            <DrawPanel
              drawScript={drawScript}
              onChangeDrawScript={setDrawScript}
              isDrawing={isDrawingRunning}
              onStartDrawing={handleStartDrawing}
              onStopDrawing={handleStopDrawing}
              onClearWhiteboard={handleClearWhiteboard}
              penColor={penColor}
              onChangePenColor={setPenColor}
              penWidth={penWidth}
              onChangePenWidth={setPenWidth}
              isPenDown={isPenDown}
              totalPointsDrawn={whiteboardPoints.length}
            />
          )}

          {currentMode === 'report' && <ReportPanel />}

          {currentMode === 'video' && <VideoPanel />}
        </aside>
      </main>

      {/* 3. Denavit-Hartenberg Parameter Table Modal */}
      <DHTableModal
        robot={currentRobot}
        jointAngles={jointAngles}
        isOpen={isDHTableOpen}
        onClose={() => setIsDHTableOpen(false)}
      />
    </div>
  );
}

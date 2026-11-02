/**
 * Kinematics - PlayPanel.tsx
 * Direct joint angle manipulation, Cartesian pose inspector, gripper control,
 * and tabletop physics object management.
 */

import React, { useState } from 'react';
import { RobotDef, CartesianPose, SceneObject } from '../../kinematics/types';
import { Sliders, RotateCcw, Box, Eye, Layers } from 'lucide-react';

interface PlayPanelProps {
  robot: RobotDef;
  jointAngles: number[]; // in radians
  onJointChange: (index: number, angleRad: number) => void;
  onSetAllJoints: (anglesRad: number[]) => void;
  currentPose: CartesianPose;
  gripperOpenAmount: number;
  onGripperChange: (amount: number) => void;
  sceneObjects: SceneObject[];
  onResetSceneObjects: () => void;
}

export const PlayPanel: React.FC<PlayPanelProps> = ({
  robot,
  jointAngles,
  onJointChange,
  onSetAllJoints,
  currentPose,
  gripperOpenAmount,
  onGripperChange,
  sceneObjects,
  onResetSceneObjects,
}) => {
  const [activeTab, setActiveTab] = useState<'joints' | 'matrix' | 'objects'>('joints');

  const heldObject = sceneObjects.find((o) => o.isHeld);

  // Common quick pose presets
  const presets: { name: string; angles: number[] }[] = [
    { name: 'Home Pose', angles: [0, -Math.PI / 2, Math.PI / 2, -Math.PI / 2, -Math.PI / 2, 0] },
    { name: 'Forward Reach', angles: [0, -1.0, 1.8, -2.37, -Math.PI / 2, 0] },
    { name: 'Upright Zero', angles: [0, -Math.PI / 2, 0, -Math.PI / 2, 0, 0] },
    { name: 'Tucked Transport', angles: [0, -2.2, 2.6, -1.97, -Math.PI / 2, 0] },
    { name: 'Table Grasp', angles: [0.35, -1.42, 2.40, -2.55, -Math.PI / 2, 0.35] },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden text-slate-100">
      {/* Sub-Tabs: Joints, Matrix, Objects */}
      <div className="flex border-b border-slate-800 bg-slate-900/95 shrink-0">
        <button
          onClick={() => setActiveTab('joints')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'joints'
              ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Joint Sliders</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'matrix'
              ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>FK Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('objects')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'objects'
              ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Objects ({sceneObjects.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'joints' && (
          <>
            {/* Quick Presets Strip */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Quick Pose Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.slice(0, robot.dof === 6 ? 5 : 2).map((p) => (
                  <button
                    key={p.name}
                    onClick={() => onSetAllJoints(p.angles.slice(0, robot.dof))}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Joint Controls */}
            <div className="space-y-3 pt-2">
              {robot.dh.map((row, idx) => {
                const angleRad = jointAngles[idx] ?? 0;
                const angleDeg = Math.round(angleRad * 57.2958);
                const minDeg = Math.round(row.min * 57.2958);
                const maxDeg = Math.round(row.max * 57.2958);

                return (
                  <div key={idx} className="p-3 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-200 font-semibold">{row.name}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-cyan-400 font-bold">{angleDeg}°</span>
                        <span className="text-slate-500">({angleRad.toFixed(3)} rad)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-mono w-7">{minDeg}°</span>
                      <input
                        type="range"
                        min={minDeg}
                        max={maxDeg}
                        step={1}
                        value={angleDeg}
                        onChange={(e) => onJointChange(idx, (parseFloat(e.target.value) * Math.PI) / 180)}
                        className="flex-1 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 font-mono w-7 text-right">{maxDeg}°</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gripper Open/Close Control */}
            <div className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-200">Parallel Jaw Gripper</span>
                <span className="font-mono text-cyan-400">
                  {gripperOpenAmount <= 0.1 ? 'CLOSED' : gripperOpenAmount >= 0.9 ? 'OPEN' : `${Math.round(gripperOpenAmount * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400">Close</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={gripperOpenAmount}
                  onChange={(e) => onGripperChange(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Open</span>
              </div>
              {heldObject && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium pt-1">
                  <span>● Holding:</span>
                  <span className="font-semibold">{heldObject.name}</span>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-200">Forward Kinematics $T_0^n$</div>
              <p className="text-[11px] text-slate-400">
                Complete homogeneous $4 \times 4$ transformation matrix from base frame to tool flange.
              </p>
            </div>

            {/* 4x4 Matrix Table */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <table className="w-full text-center border-collapse">
                <tbody>
                  {currentPose.matrix.map((row, r) => (
                    <tr key={r} className="border-b border-slate-800/60 last:border-none">
                      {row.map((val, c) => (
                        <td
                          key={c}
                          className={`py-1.5 px-2 tabular-nums ${
                            c === 3 ? 'text-cyan-400 font-semibold' : 'text-slate-300'
                          }`}
                        >
                          {val >= 0 ? ` ${val.toFixed(3)}` : val.toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Decomposition explanation */}
            <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-slate-200">Matrix Components:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Columns 1-3: Rotation matrix R in SO(3)</li>
                <li>Column 4: End-effector translation vector p = [X, Y, Z]ᵀ</li>
                <li>Row 4: Projective scale [0, 0, 0, 1]</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'objects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">Tabletop Physics Objects</div>
                <div className="text-[11px] text-slate-400">Rigid-body interaction with gravity and gripper latching.</div>
              </div>
              <button
                onClick={onResetSceneObjects}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-2">
              {sceneObjects.map((obj) => (
                <div
                  key={obj.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    obj.isHeld
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-800/50 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: obj.color }}
                    />
                    <div>
                      <div className="font-semibold text-slate-200">{obj.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        pos: [{obj.position[0].toFixed(2)}, {obj.position[1].toFixed(2)}, {obj.position[2].toFixed(2)}]
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      obj.isHeld ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {obj.isHeld ? 'GRASPED' : 'RESTING'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed">
              💡 <b>How to pick up:</b> Move the robot gripper close to an object (within 9 cm) and set Gripper to <b>Closed</b>. The object will attach and follow the arm until released!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

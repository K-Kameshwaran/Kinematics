/**
 * Kinematics - Header.tsx
 * Top Navigation Bar adhering to the Top Bar Contract with mode tabs,
 * robot model selection, and simulation toggles.
 */

import React from 'react';
import { AppMode, RobotModelId } from '../kinematics/types';
import { ROBOTS } from '../kinematics/robots';
import { BookOpen, Sliders, Code2, PenTool, FileText, Film, Table, Eye, Sparkles, RotateCcw } from 'lucide-react';

interface HeaderProps {
  currentMode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  selectedRobotId: RobotModelId;
  onChangeRobot: (id: RobotModelId) => void;
  showFrames: boolean;
  onToggleFrames: () => void;
  showTrace: boolean;
  onToggleTrace: () => void;
  onResetPose: () => void;
  onOpenDHTable: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onChangeMode,
  selectedRobotId,
  onChangeRobot,
  showFrames,
  onToggleFrames,
  showTrace,
  onToggleTrace,
  onResetPose,
  onOpenDHTable,
}) => {
  const modes: { id: AppMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'play', label: 'Play', icon: Sliders },
    { id: 'simulate', label: 'Simulate', icon: Code2 },
    { id: 'draw', label: 'Draw', icon: PenTool },
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'video', label: 'Video Demo', icon: Film },
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-6 shrink-0 z-20 select-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-base">
          🦾
        </div>
        <span className="font-extrabold text-base tracking-tight text-white">
          Kinematics
        </span>
      </div>

      {/* Zone 2: Navigation Mode Tabs */}
      <nav className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChangeMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Robot Selector & Viewport Utility Toggles */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Robot Model Dropdown */}
        <select
          value={selectedRobotId}
          onChange={(e) => onChangeRobot(e.target.value as RobotModelId)}
          className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs rounded-lg outline-none focus:border-cyan-500 cursor-pointer"
        >
          {Object.values(ROBOTS).map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.dof}-DOF)
            </option>
          ))}
        </select>

        {/* DH Table Button */}
        <button
          onClick={onOpenDHTable}
          title="Denavit–Hartenberg Table"
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <Table className="w-4 h-4" />
        </button>

        {/* Reference Frames Toggle */}
        <button
          onClick={onToggleFrames}
          title="Toggle Joint Coordinate Frames"
          className={`p-1.5 rounded-lg border transition-colors ${
            showFrames
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Trajectory Trace Toggle */}
        <button
          onClick={onToggleTrace}
          title="Toggle Motion Trail"
          className={`p-1.5 rounded-lg border transition-colors ${
            showTrace
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Reset Home Pose */}
        <button
          onClick={onResetPose}
          title="Reset to Home Pose"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

/**
 * Kinematics - SimulatePanel.tsx
 * Code editor for python-urx and JavaScript with line numbers, syntax highlighting,
 * template loader, speed control, execution state machine, and live terminal console.
 */

import React, { useState } from 'react';
import { SIMULATION_TEMPLATES } from '../../kinematics/templates';
import { SimulationLog, CodeTemplate } from '../../kinematics/types';
import { Play, Pause, Square, SkipForward, Terminal, Trash2, Gauge, Code2 } from 'lucide-react';

interface SimulatePanelProps {
  code: string;
  onChangeCode: (code: string) => void;
  isRunning: boolean;
  isPaused: boolean;
  onRun: () => void;
  onPause: () => void;
  onStep: () => void;
  onStop: () => void;
  speedMultiplier: number;
  onChangeSpeed: (speed: number) => void;
  logs: SimulationLog[];
  onClearLogs: () => void;
  currentRunningLine?: number;
  syntaxErrors?: string[];
}

export const SimulatePanel: React.FC<SimulatePanelProps> = ({
  code,
  onChangeCode,
  isRunning,
  isPaused,
  onRun,
  onPause,
  onStep,
  onStop,
  speedMultiplier,
  onChangeSpeed,
  logs,
  onClearLogs,
  currentRunningLine,
  syntaxErrors = [],
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(SIMULATION_TEMPLATES[0].id);

  const lines = code.split('\n');

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = SIMULATION_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      onChangeCode(tmpl.code);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden text-slate-100">
      {/* Top Toolbar: Template selector & Speed */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/95 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            <Code2 className="w-3.5 h-3.5" />
            <span>Simulation Script Editor</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={speedMultiplier}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-1.5 py-0.5 outline-none font-mono"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1.0}>1.0x (Normal)</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x (Fast)</option>
            </select>
          </div>
        </div>

        {/* Template Selector */}
        <select
          value={selectedTemplateId}
          onChange={(e) => handleSelectTemplate(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 outline-none focus:border-cyan-500"
        >
          {SIMULATION_TEMPLATES.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.title}
            </option>
          ))}
        </select>
      </div>

      {/* Code Editor with Line Numbers */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 border-b border-slate-800 relative">
        <div className="flex-1 flex overflow-hidden font-mono text-xs">
          {/* Line Numbers Column */}
          <div className="w-10 py-3 bg-slate-900/70 border-r border-slate-800 text-slate-600 select-none text-right pr-2 space-y-[2px] overflow-hidden text-[11px]">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`leading-5 ${
                  currentRunningLine === i + 1
                    ? 'text-cyan-400 font-bold bg-cyan-500/20 rounded-l'
                    : ''
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea Code Input */}
          <textarea
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            disabled={isRunning && !isPaused}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent text-emerald-300 resize-none outline-none leading-5 font-mono text-xs overflow-auto selection:bg-cyan-500/30 whitespace-pre tab-4"
          />
        </div>

        {/* Syntax Error Highlights Box */}
        {syntaxErrors.length > 0 && (
          <div className="p-2 bg-rose-950/80 border-t border-rose-800/80 text-[11px] text-rose-300 space-y-0.5">
            {syntaxErrors.map((err, idx) => (
              <div key={idx}>⚠️ {err}</div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Controls Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2 shrink-0">
        {!isRunning || isPaused ? (
          <button
            onClick={onRun}
            className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPaused ? 'Resume' : 'Run Script'}</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onStep}
          disabled={!isRunning || !isPaused}
          title="Single Step Forward"
          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={onStop}
          disabled={!isRunning && !isPaused}
          title="Stop & Reset Simulation"
          className="p-2 bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 text-rose-300 rounded-lg border border-rose-500/30 transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Terminal Output Log Console */}
      <div className="h-44 bg-slate-950 flex flex-col overflow-hidden shrink-0">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live Console Output</span>
          </div>
          <button
            onClick={onClearLogs}
            title="Clear Console"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">No output. Press Run to execute the script.</div>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  log.level === 'error'
                    ? 'text-rose-400'
                    : log.level === 'warn'
                    ? 'text-amber-400'
                    : log.level === 'success'
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-slate-600 text-[10px] shrink-0 select-none">{log.timestamp}</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

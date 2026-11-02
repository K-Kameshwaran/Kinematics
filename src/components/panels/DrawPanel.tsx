/**
 * Kinematics - DrawPanel.tsx
 * Whiteboard Drawing Laboratory with Levenberg-Marquardt IK execution,
 * drawing templates, pen styling, stroke management, and download.
 */

import React, { useState } from 'react';
import { DRAWING_TEMPLATES } from '../../kinematics/templates';
import { PenTool, Play, Square, RotateCcw, Download, Sparkles, Palette } from 'lucide-react';
import { PenStrokePoint } from '../../kinematics/types';

interface DrawPanelProps {
  drawScript: string;
  onChangeDrawScript: (script: string) => void;
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onClearWhiteboard: () => void;
  penColor: string;
  onChangePenColor: (color: string) => void;
  penWidth: number;
  onChangePenWidth: (width: number) => void;
  isPenDown: boolean;
  totalPointsDrawn: number;
}

export const DrawPanel: React.FC<DrawPanelProps> = ({
  drawScript,
  onChangeDrawScript,
  isDrawing,
  onStartDrawing,
  onStopDrawing,
  onClearWhiteboard,
  penColor,
  onChangePenColor,
  penWidth,
  onChangePenWidth,
  isPenDown,
  totalPointsDrawn,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(DRAWING_TEMPLATES[0].id);

  const lines = drawScript.split('\n');

  const colorPalette = [
    { name: 'Cyan', hex: '#00D4AA' },
    { name: 'Sky Blue', hex: '#38BDF8' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Dark Slate', hex: '#0F172A' },
  ];

  const handleSelectTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = DRAWING_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      onChangeDrawScript(tmpl.code);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden text-slate-100">
      {/* Header & Template Selector */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/95 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            <PenTool className="w-3.5 h-3.5" />
            <span>Whiteboard Drawing Lab</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isPenDown ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className={isPenDown ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
              {isPenDown ? 'PEN DOWN' : 'PEN UP'}
            </span>
          </div>
        </div>

        <select
          value={selectedTemplateId}
          onChange={(e) => handleSelectTemplate(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 outline-none focus:border-cyan-500"
        >
          {DRAWING_TEMPLATES.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.title}
            </option>
          ))}
        </select>
      </div>

      {/* Pen Settings Controls */}
      <div className="p-3 bg-slate-800/40 border-b border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
            <Palette className="w-3 h-3 text-cyan-400" />
            <span>Marker Color</span>
          </span>
          <div className="flex items-center gap-1.5">
            {colorPalette.map((c) => (
              <button
                key={c.hex}
                onClick={() => onChangePenColor(c.hex)}
                title={c.name}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  penColor === c.hex ? 'scale-125 border-white shadow-md' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400 text-[11px] font-medium">Stroke Width</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={8}
              value={penWidth}
              onChange={(e) => onChangePenWidth(parseInt(e.target.value, 10))}
              className="w-24 accent-cyan-400 h-1.5 bg-slate-700 rounded cursor-pointer"
            />
            <span className="font-mono text-cyan-400 text-[11px] w-6 text-right">{penWidth}px</span>
          </div>
        </div>
      </div>

      {/* Script Editor with Line Numbers */}
      <div className="flex-1 flex overflow-hidden bg-slate-950 font-mono text-xs border-b border-slate-800 min-h-0">
        <div className="w-10 py-3 bg-slate-900/70 border-r border-slate-800 text-slate-600 select-none text-right pr-2 space-y-[2px] text-[11px]">
          {lines.map((_, i) => (
            <div key={i} className="leading-5">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          value={drawScript}
          onChange={(e) => onChangeDrawScript(e.target.value)}
          disabled={isDrawing}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-cyan-300 resize-none outline-none leading-5 font-mono text-xs overflow-auto selection:bg-cyan-500/30 whitespace-pre"
        />
      </div>

      {/* Action Buttons & Status */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          {!isDrawing ? (
            <button
              onClick={onStartDrawing}
              className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Robotic Draw</span>
            </button>
          ) : (
            <button
              onClick={onStopDrawing}
              className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Halt Drawing</span>
            </button>
          )}

          <button
            onClick={onClearWhiteboard}
            disabled={isDrawing}
            title="Wipe Whiteboard"
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
          <span>Strokes Rendered:</span>
          <span className="text-cyan-400 font-bold">{totalPointsDrawn} pts</span>
        </div>

        <div className="p-2 bg-slate-800/40 border border-slate-800 rounded-lg text-[10px] text-slate-400 leading-relaxed font-sans">
          ⚙️ <b>How it works:</b> <code>draw_to(x, y)</code> converts UV coordinates to 3D whiteboard surface coordinates and executes Levenberg–Marquardt DLS numerical inverse kinematics with a tool-down orientation constraint to guarantee straight lines!
        </div>
      </div>
    </div>
  );
};

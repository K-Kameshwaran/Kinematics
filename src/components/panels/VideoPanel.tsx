/**
 * Kinematics - VideoPanel.tsx
 * Embedded Demonstration Video Player showcasing whiteboard drawing with Levenberg-Marquardt IK.
 */

import React, { useRef } from 'react';
import { Film, Play, Clock, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

export const VideoPanel: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = '/assets/kinematics/Kinematics_Demo_Video.mp4';

  const timestamps = [
    { time: 0, label: '00:00 - Simulator & Whiteboard Setup', desc: 'Environment initialization and whiteboard mounting' },
    { time: 1.5, label: '00:01 - Pen Tool Approach', desc: 'Robot aligns end-effector normal to whiteboard surface' },
    { time: 3.0, label: '00:03 - Cartesian Straight Line IK', desc: 'Levenberg-Marquardt solver draws letter "H"' },
    { time: 6.0, label: '00:06 - Crossbar and Stem', desc: 'Tool-down orientation maintained across transitions' },
    { time: 9.0, label: '00:09 - Letter "i" & Pen Retract', desc: 'Completing "Hi" message and safe retract' },
  ];

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden text-slate-100">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">Video Demonstration</h2>
            <div className="text-[10px] text-slate-400 font-mono">Kinematics Whiteboard Drawing</div>
          </div>
        </div>

        <button
          onClick={() => seekTo(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>
      </div>

      {/* Video Player */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col items-center justify-center shrink-0">
        <div className="w-full max-w-xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative group">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Chapter Breakdown & Highlights */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <div className="text-xs font-bold text-slate-100 mb-1">Demonstration Timeline & Key Features</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click any timestamp to jump directly to that point in the demonstration:
          </p>
        </div>

        <div className="space-y-2">
          {timestamps.map((t, i) => (
            <button
              key={i}
              onClick={() => seekTo(t.time)}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all flex items-start gap-3 group"
            >
              <div className="p-1.5 bg-slate-700/60 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 rounded-lg transition-colors mt-0.5">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                  {t.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                  {t.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why This Demo Matters</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            In standard joint-space interpolation (<code>movej</code>), the robot tip sweeps circular arcs in 3D space. To draw straight strokes on a flat surface, the arm must dynamically solve damped least-squares numerical IK at 10 sub-steps per segment while enforcing a tool-down orientation constraint.
          </p>
        </div>
      </div>
    </div>
  );
};

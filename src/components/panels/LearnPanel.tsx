/**
 * Kinematics - LearnPanel.tsx
 * Interactive lesson reader for Caltech Advanced Robotics curriculum.
 */

import React, { useState } from 'react';
import { LESSONS } from '../../kinematics/lessons';
import { Lesson, LessonConfig } from '../../kinematics/types';
import { BookOpen, ChevronRight, ChevronLeft, Play, CheckCircle2 } from 'lucide-react';

interface LearnPanelProps {
  onApplyConfig: (config: LessonConfig) => void;
}

export const LearnPanel: React.FC<LearnPanelProps> = ({ onApplyConfig }) => {
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const currentLesson: Lesson = LESSONS[selectedLessonIdx] || LESSONS[0];

  const chapters = Array.from(new Set(LESSONS.map((l) => l.chapter)));

  const handleApplyPreset = () => {
    onApplyConfig(currentLesson.config);
  };

  const handleNext = () => {
    if (selectedLessonIdx < LESSONS.length - 1) {
      const nextIdx = selectedLessonIdx + 1;
      setSelectedLessonIdx(nextIdx);
      onApplyConfig(LESSONS[nextIdx].config);
    }
  };

  const handlePrev = () => {
    if (selectedLessonIdx > 0) {
      const prevIdx = selectedLessonIdx - 1;
      setSelectedLessonIdx(prevIdx);
      onApplyConfig(LESSONS[prevIdx].config);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden text-slate-100">
      {/* Chapter & Lesson Selector Dropdown / Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/95 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Curriculum</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Lesson {selectedLessonIdx + 1} of {LESSONS.length}
          </span>
        </div>

        <select
          value={selectedLessonIdx}
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            setSelectedLessonIdx(idx);
            onApplyConfig(LESSONS[idx].config);
          }}
          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 outline-none focus:border-cyan-500"
        >
          {chapters.map((ch) => (
            <optgroup key={ch} label={ch}>
              {LESSONS.map((l, idx) =>
                l.chapter === ch ? (
                  <option key={l.id} value={idx}>
                    {idx + 1}. {l.title}
                  </option>
                ) : null
              )}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Lesson Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            {currentLesson.chapter}
          </div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>{currentLesson.icon}</span>
            <span>{currentLesson.title}</span>
          </h2>
        </div>

        {/* Action Button: Auto-Configure 3D Viewport */}
        <button
          onClick={handleApplyPreset}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Auto-Configure 3D Viewport for this Lesson</span>
        </button>

        {/* Lesson Sections */}
        <div className="space-y-4">
          {currentLesson.sections.map((sec, i) => (
            <div key={i} className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{sec.title}</span>
              </h3>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                {sec.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
        <button
          onClick={handlePrev}
          disabled={selectedLessonIdx === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
        <span className="text-[11px] font-mono text-slate-400">
          {selectedLessonIdx + 1} / {LESSONS.length}
        </span>
        <button
          onClick={handleNext}
          disabled={selectedLessonIdx === LESSONS.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

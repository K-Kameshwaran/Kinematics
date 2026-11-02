/**
 * Kinematics - ReportPanel.tsx
 * Project Report Viewer for Caltech ME/CDS/EE 235a Advanced Robotics
 */

import React from 'react';
import { FileText, Download, ExternalLink, GraduationCap, Award, BookCheck } from 'lucide-react';

export const ReportPanel: React.FC = () => {
  const pdfUrl = '/assets/kinematics/Kinematics_ProjectReport.pdf';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden text-slate-100">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100">Caltech Project Report</h2>
            <div className="text-[10px] text-slate-400 font-mono">ME/CDS/EE 235a · March 2026</div>
          </div>
        </div>

        <a
          href={pdfUrl}
          download="Kinematics_ProjectReport.pdf"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </a>
      </div>

      {/* Report Summary Card & Highlights */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 space-y-3 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-sm font-bold text-slate-100">
              Kinematics: An Interactive Robot Manipulator Simulator for Education and Code Testing
            </h1>
            <div className="text-xs text-cyan-400 font-medium mt-0.5">
              Jonas Hansen — California Institute of Technology
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
            Final Project
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          A comprehensive web-based toolkit for forward and inverse kinematics, trajectory planning, pick-and-place, and whiteboard drawing with robotic manipulators. Formulates exact Denavit–Hartenberg conventions for Universal Robots UR10e, UR5e, and UR3e arms alongside an integrated Levenberg–Marquardt numerical IK drawing engine.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Convention</span>
            <span className="font-semibold text-slate-200">Standard DH Table</span>
          </div>
          <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">IK Method</span>
            <span className="font-semibold text-slate-200">Damped Least-Squares</span>
          </div>
          <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">API Emulation</span>
            <span className="font-semibold text-slate-200">python-urx Compatible</span>
          </div>
        </div>
      </div>

      {/* Embedded PDF Document Viewer */}
      <div className="flex-1 bg-slate-950 p-2 min-h-0 relative">
        <iframe
          src={pdfUrl}
          title="Kinematics Project Report PDF"
          className="w-full h-full rounded-lg border border-slate-800 bg-slate-900 shadow-inner"
        />
      </div>
    </div>
  );
};

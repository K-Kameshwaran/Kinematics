/**
 * Kinematics - DHTableModal.tsx
 * Modal dialog for inspecting the exact Denavit-Hartenberg parameters
 * and coordinate frame conventions of the active robot.
 */

import React from 'react';
import { RobotDef } from '../kinematics/types';
import { X, Table, HelpCircle, Layers } from 'lucide-react';

interface DHTableModalProps {
  robot: RobotDef;
  jointAngles: number[];
  isOpen: boolean;
  onClose: () => void;
}

export const DHTableModal: React.FC<DHTableModalProps> = ({
  robot,
  jointAngles,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Denavit–Hartenberg Parameters</span>
                <span className="text-slate-500">·</span>
                <span className="text-cyan-400">{robot.name}</span>
              </h2>
              <div className="text-[11px] text-slate-400">
                Standard classical DH parameterization convention (Craig / Spong)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Joint</th>
                  <th className="py-2.5 px-3">Joint Name</th>
                  <th className="py-2.5 px-3">θᵢ (rad)</th>
                  <th className="py-2.5 px-3">dᵢ (m)</th>
                  <th className="py-2.5 px-3">aᵢ (m)</th>
                  <th className="py-2.5 px-3">αᵢ (rad)</th>
                  <th className="py-2.5 px-3">Current θ</th>
                  <th className="py-2.5 px-3">Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {robot.dh.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 text-cyan-400 font-bold">{i + 1}</td>
                    <td className="py-2 px-3 font-sans text-slate-200">{row.name}</td>
                    <td className="py-2 px-3 tabular-nums">{row.theta === 0 ? '0' : row.theta.toFixed(3)}</td>
                    <td className="py-2 px-3 tabular-nums text-slate-200 font-semibold">{row.d.toFixed(3)}</td>
                    <td className="py-2 px-3 tabular-nums text-slate-200 font-semibold">{row.a.toFixed(3)}</td>
                    <td className="py-2 px-3 tabular-nums">
                      {row.alpha === 0
                        ? '0'
                        : row.alpha > 0
                        ? `+π/2 (${row.alpha.toFixed(3)})`
                        : `-π/2 (${row.alpha.toFixed(3)})`}
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-bold tabular-nums">
                      {(((jointAngles[i] ?? 0) * 180) / Math.PI).toFixed(1)}°
                    </td>
                    <td className="py-2 px-3 text-slate-500 tabular-nums">
                      [{((row.min * 180) / Math.PI).toFixed(0)}°, {((row.max * 180) / Math.PI).toFixed(0)}°]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Educational Formula & Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Link Transformation Matrix Tᵢ</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-cyan-300 leading-relaxed overflow-x-auto shadow-inner">
                Tᵢ = Rot_z(θᵢ) · Trans_z(dᵢ) · Trans_x(aᵢ) · Rot_x(αᵢ)
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Transforms coordinates from link frame i to link frame i-1. In standard DH convention, z₍ᵢ₋₁₎ is always the axis of joint actuation.
              </p>
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Parameter Definitions</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                <li>
                  <b className="text-slate-200">θᵢ (Joint Angle)</b>: Rotation about z₍ᵢ₋₁₎ from x₍ᵢ₋₁₎ to xᵢ
                </li>
                <li>
                  <b className="text-slate-200">dᵢ (Link Offset)</b>: Distance along z₍ᵢ₋₁₎ from origin O₍ᵢ₋₁₎ to intersection with xᵢ
                </li>
                <li>
                  <b className="text-slate-200">aᵢ (Link Length)</b>: Distance along xᵢ from z₍ᵢ₋₁₎ to zᵢ (shortest common normal)
                </li>
                <li>
                  <b className="text-slate-200">αᵢ (Link Twist)</b>: Angle between z₍ᵢ₋₁₎ and zᵢ about xᵢ
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

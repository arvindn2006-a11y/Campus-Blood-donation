import React, { useState } from 'react';
import { X, Heart, Sparkles, Check, AlertCircle, Info } from 'lucide-react';
import { RBC_COMPATIBILITY } from '../utils/bloodCompatibility';

export default function CompatibilityMatrixModal({ isOpen, onClose }) {
  const [selectedGroup, setSelectedGroup] = useState('O+');

  if (!isOpen) return null;

  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

  // Calculate who can give to selectedGroup
  const canReceiveFrom = RBC_COMPATIBILITY[selectedGroup] || [];

  // Calculate who selectedGroup can give TO
  const canDonateTo = bloodGroups.filter(bg => {
    const compatible = RBC_COMPATIBILITY[bg] || [];
    return compatible.includes(selectedGroup);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#111728] to-[#0a0d16] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-white">Smart Blood Compatibility Matrix</h3>
              <p className="text-xs text-slate-400">ABO & Rh Antigen Rules for University Emergency Matching</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Selector */}
        <div className="mt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select Blood Group to Inspect:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {bloodGroups.map(bg => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`py-2 rounded-xl font-heading font-black text-sm border transition-all ${
                  selectedGroup === bg
                    ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40 scale-105'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Live Compatibility Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          
          {/* Can Receive From */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{selectedGroup} Can Receive From:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {canReceiveFrom.map(bg => (
                <span
                  key={bg}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-500/30 text-xs font-bold font-mono"
                >
                  {bg}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {selectedGroup === 'AB+' ? '🌟 Universal Recipient (Can receive all blood groups)' : `${canReceiveFrom.length} compatible donor group(s).`}
            </p>
          </div>

          {/* Can Give To */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{selectedGroup} Can Donate To:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {canDonateTo.map(bg => (
                <span
                  key={bg}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs font-bold font-mono"
                >
                  {bg}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {selectedGroup === 'O-' ? '🌟 Universal Red Cell Donor (Can donate to anyone)' : `Can safely help ${canDonateTo.length} recipient group(s).`}
            </p>
          </div>

        </div>

        {/* Quick Facts */}
        <div className="mt-6 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <Info className="w-4 h-4" />
            <span>Campus Emergency Matching Engine Protocol</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            When an emergency request is generated, our engine prioritizes <strong>EXACT matches</strong> first, followed immediately by <strong>compatible groups</strong>. All matched donors receive concurrent WebSocket push notifications and SMS alerts.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary py-2 px-6 text-xs font-bold"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}

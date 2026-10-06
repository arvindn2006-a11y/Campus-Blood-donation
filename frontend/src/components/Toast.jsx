import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl bg-[#151c2e] border border-white/10 text-white animate-fade-in">
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      )}
      <span className="text-xs font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { User, CheckCircle, Clock, BookOpen, Shield } from 'lucide-react';

export default function DonorCard({ donor, onSelect }) {
  const isAvailable = Boolean(donor.availability);

  return (
    <div className="glass-card-hover p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-slate-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-bold text-white text-base truncate">{donor.name}</h4>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isAvailable ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
              {isAvailable ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-slate-500" /> {donor.department} (Yr {donor.year})</span>
            <span>ID: <strong className="text-slate-300">{donor.campus_id || donor.student_id}</strong></span>
          </div>
          {donor.phone && donor.phone !== '***-***-****' && (
            <p className="text-[11px] text-rose-400 font-mono mt-0.5">📞 {donor.phone}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-center px-3 py-1.5 rounded-xl bg-rose-600/15 border border-rose-500/30">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">Blood Group</span>
          <span className="font-heading font-extrabold text-lg text-white">{donor.blood_group}</span>
        </div>
      </div>
    </div>
  );
}

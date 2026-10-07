import React from 'react';
import { Link } from 'react-router-dom';
import { Hospital, MapPin, Calendar, Clock, AlertTriangle, Users } from 'lucide-react';

export default function BloodRequestCard({ request }) {
  if (!request) return null;

  const urgencyClasses = {
    EMERGENCY: 'border-red-500/50 bg-red-950/20 text-red-400',
    URGENT: 'border-amber-500/50 bg-amber-950/20 text-amber-400',
    NORMAL: 'border-blue-500/50 bg-blue-950/20 text-blue-400'
  };

  const statusClasses = {
    EMERGENCY: 'bg-red-500/20 text-red-400 border-red-500/30',
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    COMPLETED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    CANCELLED: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  };

  return (
    <div className="glass-card-hover p-5 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center font-heading font-black text-2xl text-white shadow-lg shadow-rose-900/40 p-2 border border-rose-400/30">
              {request.blood_group || request.bloodGroup || 'O+'}
            </div>
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block">Required</span>
              <h3 className="font-heading font-bold text-lg text-white leading-tight">
                {request.units_required || request.unitsRequired || 1} Unit(s) {request.component || 'RBC'}
              </h3>
            </div>
          </div>

          <span className={`text-[11px] uppercase font-bold px-2.5 py-1 rounded-full border ${urgencyClasses[request.urgency] || urgencyClasses.NORMAL}`}>
            {request.urgency}
          </span>
        </div>

        {/* Details Grid */}
        <div className="space-y-2 text-xs text-slate-300 mb-5">
          <div className="flex items-center gap-2">
            <Hospital className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">{request.hospital_name || request.hospitalName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{request.hospital_address || request.hospitalAddress}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{request.required_date ? new Date(request.required_date).toLocaleDateString() : 'Immediate'}</span>
            </div>
            {request.required_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{request.required_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>{request.total_matched_donors || 0} matched ({request.accepted_donors || 0} accepted)</span>
        </div>
        <Link
          to={`/requests/${request.id}`}
          className="btn-primary text-xs py-1.5 px-3"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

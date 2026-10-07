import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { AlertOctagon, X, Zap, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function RealtimeAlertBanner() {
  const { incomingAlert, clearIncomingAlert } = useSocket() || {};

  useEffect(() => {
    if (incomingAlert) {
      sounds.playEmergencyAlert();
    }
  }, [incomingAlert]);

  if (!incomingAlert) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-8 duration-300">
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-800 p-4 sm:p-5 rounded-3xl shadow-2xl shadow-red-950/80 border border-red-400/40 text-white flex items-start justify-between gap-3 relative overflow-hidden">
        
        {/* Pulsing beacon glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2.5 bg-black/30 border border-white/20 rounded-2xl shrink-0">
            <AlertOctagon className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-black bg-black/40 px-2 py-0.5 rounded-full border border-white/20">
                🚨 Live Emergency Broadcast
              </span>
              <span className="text-[11px] font-bold text-red-100">
                {incomingAlert.urgency || 'EMERGENCY'}
              </span>
            </div>
            
            <h4 className="font-heading font-black text-xl mt-1 leading-tight text-white">
              {incomingAlert.blood_group} Blood Needed!
            </h4>
            <p className="text-xs text-red-100 mt-0.5 leading-snug">
              🏥 <strong>{incomingAlert.hospital_name}</strong> requires {incomingAlert.units_required || 1} unit(s) urgently.
            </p>

            <div className="flex items-center gap-2 mt-3.5">
              <Link
                to={`/requests/${incomingAlert.id}`}
                onClick={clearIncomingAlert}
                className="px-3.5 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-black shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span>Respond (I Can Donate)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={clearIncomingAlert}
                className="px-2.5 py-2 text-xs text-red-100 hover:text-white font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={clearIncomingAlert}
          className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-black/20 transition-colors relative z-10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

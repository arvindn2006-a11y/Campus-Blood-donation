import React from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { AlertOctagon, X } from 'lucide-react';

export default function RealtimeAlertBanner() {
  const { incomingAlert, clearIncomingAlert } = useSocket();

  if (!incomingAlert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-bounce-short">
      <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 rounded-2xl shadow-2xl shadow-red-950/80 border border-red-400/40 text-white flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <AlertOctagon className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded">
                Live Campus Alert
              </span>
              <span className="text-xs font-bold text-red-100">🚨 {incomingAlert.urgency || 'EMERGENCY'}</span>
            </div>
            <h4 className="font-heading font-extrabold text-lg mt-1 leading-tight">
              {incomingAlert.blood_group} Blood Required!
            </h4>
            <p className="text-xs text-red-100 mt-0.5">
              🏥 {incomingAlert.hospital_name} needs {incomingAlert.units_required || 1} unit(s).
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                to={`/requests/${incomingAlert.id}`}
                onClick={clearIncomingAlert}
                className="px-3 py-1.5 bg-white text-rose-700 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-md transition-colors"
              >
                Respond Immediately
              </Link>
              <button
                onClick={clearIncomingAlert}
                className="px-2.5 py-1.5 text-xs text-red-100 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={clearIncomingAlert}
          className="text-red-200 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

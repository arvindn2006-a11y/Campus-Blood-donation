import React, { useState, useEffect } from 'react';
import { MessageSquare, Smartphone, Copy, Check, X, Zap, ShieldAlert } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { useSocket } from '../context/SocketContext';

export default function SmsNotificationHud({ activeOtp, onAutoFill, onClose }) {
  const { recentEvents } = useSocket() || {};
  const [copied, setCopied] = useState(false);
  const [displayAlert, setDisplayAlert] = useState(activeOtp || null);

  useEffect(() => {
    if (activeOtp) {
      setDisplayAlert(activeOtp);
      sounds.playOtpArrival();
    }
  }, [activeOtp]);

  // Also listen for socket broadcast
  useEffect(() => {
    if (recentEvents && recentEvents.length > 0) {
      const latest = recentEvents[0];
      if (latest.type === 'SMS_RECEIVED' && latest.data?.otpCode) {
        setDisplayAlert({
          otpCode: latest.data.otpCode,
          phone: latest.data.phone,
          provider: latest.data.provider || 'SMS Gateway',
          message: latest.data.message
        });
        sounds.playOtpArrival();
      }
    }
  }, [recentEvents]);

  if (!displayAlert) return null;

  const handleCopy = () => {
    if (displayAlert.otpCode) {
      navigator.clipboard.writeText(displayAlert.otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleFill = () => {
    if (onAutoFill && displayAlert.otpCode) {
      onAutoFill(displayAlert.otpCode);
    }
  };

  const handleClose = () => {
    setDisplayAlert(null);
    if (onClose) onClose();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-6 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161c2d] to-[#0f1422] border border-rose-500/40 p-4 shadow-2xl shadow-rose-950/50 backdrop-blur-xl ring-1 ring-white/10">
        
        {/* Glowing ambient background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white tracking-wide uppercase">Real-Time SMS Alert</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  {displayAlert.provider || 'Live SMS Gateway'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">To: {displayAlert.phone}</span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 relative z-10">
          <div className="text-xs text-slate-300 leading-relaxed font-mono">
            Campus BloodConnect OTP:{' '}
            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-rose-600/30 border border-rose-500 text-rose-200 font-bold text-base tracking-[0.2em] shadow-inner">
              {displayAlert.otpCode}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Valid for 5 minutes. Real-time verification token active.
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex items-center justify-end gap-2 relative z-10">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {onAutoFill && (
            <button
              type="button"
              onClick={handleFill}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Auto-Fill Code</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

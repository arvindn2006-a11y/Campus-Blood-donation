import React from 'react';
import { Heart, ShieldCheck, PhoneCall, Info } from 'lucide-react';
import { COMPATIBILITY_LEGAL_DISCLAIMER } from '../utils/bloodCompatibility';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070a10] pt-12 pb-8 mt-20 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Brand & Purpose */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-heading font-bold text-lg text-white">Campus BloodConnect</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md">
            A real-time emergency healthcare initiative connecting student donors with campus-affiliated hospitals and patients in immediate medical need.
          </p>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-snug">
              {COMPATIBILITY_LEGAL_DISCLAIMER}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-heading font-semibold text-white text-sm uppercase tracking-wider mb-3">Quick Links</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/requests" className="hover:text-rose-400 transition-colors">Emergency Blood Requests</a></li>
            <li><a href="/register" className="hover:text-rose-400 transition-colors">Register as Student Donor</a></li>
            <li><a href="/login" className="hover:text-rose-400 transition-colors">Student Donor Login</a></li>
            <li><a href="/admin/login" className="hover:text-rose-400 transition-colors">Campus Admin Portal</a></li>
          </ul>
        </div>

        {/* Emergency & Privacy */}
        <div>
          <h4 className="font-heading font-semibold text-white text-sm uppercase tracking-wider mb-3">Emergency Contact</h4>
          <div className="space-y-2 text-xs">
            <p className="flex items-center gap-2 text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
              <span>Campus Medical Wing: <strong>+91 99990 00000</strong></span>
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict Student Privacy Protected</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-white/5 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Campus BloodConnect. Developed for life-saving community response.</p>
      </div>
    </footer>
  );
}

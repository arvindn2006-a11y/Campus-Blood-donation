import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bloodRequestService } from '../services/bloodRequestService';
import BloodRequestCard from '../components/BloodRequestCard';
import { Heart, Activity, ShieldCheck, Zap, Users, ArrowRight, PhoneCall, CheckCircle2 } from 'lucide-react';
import { COMPATIBILITY_LEGAL_DISCLAIMER } from '../utils/bloodCompatibility';

export default function Landing() {
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bloodRequestService.getAllRequests({ urgency: 'EMERGENCY' })
      .then(res => setRecentRequests(res.requests?.slice(0, 3) || []))
      .catch(err => console.error('Landing requests fetch error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-24 py-6">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto pt-10 pb-16 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
          <Zap className="w-3.5 h-3.5 fill-rose-500" />
          <span>Campus Emergency Response Network</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
          Save Lives. Connect Donors. <br />
          <span className="bg-gradient-to-r from-rose-500 via-red-400 to-rose-600 bg-clip-text text-transparent">
            Build a Blood-Ready Campus.
          </span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Campus-BloodConnect bridges the critical emergency gap by matching verified student donors with urgent hospital requests across university communities in real time.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-sm py-3 px-8 text-base shadow-xl shadow-rose-600/30">
            <Heart className="w-5 h-5 fill-white" />
            <span>Register as Donor</span>
          </Link>
          <Link to="/requests" className="btn-secondary text-sm py-3 px-8 text-base">
            <span>Find Blood Requests</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Live Metrics Pill */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          <div className="glass-card p-4 text-center">
            <span className="font-heading font-black text-2xl sm:text-3xl text-rose-500">100%</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">Verified OTP</span>
          </div>
          <div className="glass-card p-4 text-center">
            <span className="font-heading font-black text-2xl sm:text-3xl text-emerald-400">&lt; 60s</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">Real-Time Match</span>
          </div>
          <div className="glass-card p-4 text-center">
            <span className="font-heading font-black text-2xl sm:text-3xl text-cyan-400">ABO & Rh</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">Smart Engine</span>
          </div>
          <div className="glass-card p-4 text-center">
            <span className="font-heading font-black text-2xl sm:text-3xl text-amber-400">Private</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">Protected Data</span>
          </div>
        </div>
      </section>

      {/* Live Emergency Feed */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">Live Emergency Blood Requests</h2>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Direct hospital requirements currently awaiting donor response</p>
          </div>
          <Link to="/requests" className="text-rose-400 hover:text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-1">
            <span>View All ({recentRequests.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 h-56 animate-pulse" />
            ))}
          </div>
        ) : recentRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentRequests.map(req => (
              <BloodRequestCard key={req.id} request={req} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-heading font-bold text-white text-lg">No Active Emergency Requests</p>
            <p className="text-xs text-slate-400 mt-1">All current emergency blood requests on campus have been addressed!</p>
          </div>
        )}
      </section>

      {/* Core Platform Pillars */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-extrabold text-3xl text-white">Why Campus-BloodConnect?</h2>
          <p className="text-slate-400 text-sm mt-2">Engineered specifically for student communities to eliminate communication bottlenecks during life-or-death situations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl text-white">Zero-Latency Emergency Alerts</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When campus coordinators log an emergency requirement, WebSocket broadcasts and transactional SMS reach compatible donors instantly without manual delays.
            </p>
          </div>

          <div className="glass-card p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl text-white">Algorithmic Compatibility Engine</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Prioritizes exact blood group matches while mapping compatible universal donors (e.g. O- and AB+), ensuring no emergency patient goes unmatched.
            </p>
          </div>

          <div className="glass-card p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-xl text-white">Verified Phone OTP & Privacy</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every donor is verified through real SMS OTP with Firebase Phone Authentication. Sensitive student contact numbers remain hidden from public scraping.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

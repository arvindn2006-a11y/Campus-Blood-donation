import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donorService } from '../services/donorService';
import { bloodRequestService } from '../services/bloodRequestService';
import { donationService } from '../services/donationService';
import { notificationService } from '../services/notificationService';
import BloodRequestCard from '../components/BloodRequestCard';
import { Heart, Activity, Bell, Calendar, ShieldCheck, ToggleLeft, ToggleRight, PlusCircle, AlertCircle, ArrowRight, CheckCircle2, XCircle, MapPin, Phone, Clock, Sparkles } from 'lucide-react';
import Toast from '../components/Toast';
import { sounds } from '../utils/soundEffects';

export default function StudentDashboard() {
  const { user, updateUserProfile } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [myMatches, setMyMatches] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [availability, setAvailability] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [profRes, matchRes, reqRes, donRes, notifRes] = await Promise.all([
        donorService.getProfile(),
        donorService.getMyMatches().catch(() => ({ matches: [] })),
        bloodRequestService.getAllRequests(),
        donationService.getMyDonations(),
        notificationService.getUserNotifications().catch(() => ({ unreadCount: 0 }))
      ]);

      if (profRes.success) {
        setProfile(profRes.profile);
        setAvailability(Boolean(profRes.profile.availability));
      }
      if (matchRes.success) {
        setMyMatches(matchRes.matches || []);
      }
      if (reqRes.success) {
        setActiveRequests(reqRes.requests || []);
      }
      if (donRes.success) {
        setDonations(donRes.donations || []);
      }
      if (notifRes.success) {
        setUnreadNotifsCount(notifRes.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    const nextState = !availability;
    try {
      await donorService.toggleAvailability(nextState);
      setAvailability(nextState);
      updateUserProfile({ availability: nextState });
      setToast({
        message: `Donor status updated to ${nextState ? 'AVAILABLE' : 'UNAVAILABLE'}`,
        type: 'success'
      });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update availability', type: 'error' });
    }
  };

  const handleRespondMatch = async (matchId, response) => {
    setActionLoading(matchId);
    try {
      const res = await donorService.respondToMatch(matchId, response);
      if (res.success) {
        if (response === 'AVAILABLE') {
          sounds.playSuccess();
        }
        setToast({ message: res.message, type: 'success' });
        // Optimistically update match state
        setMyMatches(prev => prev.map(m => m.match_id === matchId ? { ...m, response } : m));
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to record response', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingMatches = myMatches.filter(m => m.response === 'PENDING');

  return (
    <div className="space-y-8 py-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Banner & Quick Controls */}
      <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-l-rose-500 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Welcome back, {user?.name || 'Student Donor'}! 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Department of {profile?.department || user?.department || 'Engineering'} • Roll ID: <strong className="text-slate-200">{profile?.student_id || user?.studentId}</strong> • Blood Group: <strong className="text-rose-400 font-mono font-bold">{profile?.blood_group || user?.bloodGroup}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Availability Toggle Switch */}
          <button
            onClick={handleToggleAvailability}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${availability ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 shadow-lg shadow-emerald-950/30' : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'}`}
          >
            {availability ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
            <span>{availability ? 'Available for Emergencies' : 'Marked Unavailable'}</span>
          </button>

          <Link to="/create-request" className="btn-primary text-xs py-2.5 px-4 shadow-lg shadow-rose-600/30">
            <PlusCircle className="w-4 h-4" />
            <span>Create Request</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Blood Group */}
        <div className="glass-card p-5 flex items-center justify-between border border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Blood Group</span>
            <h3 className="font-heading font-black text-3xl text-rose-500 mt-1">
              {profile?.blood_group || user?.bloodGroup || 'O+'}
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verified campus profile
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-md">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
        </div>

        {/* Total Donations */}
        <div className="glass-card p-5 flex items-center justify-between border border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Donations</span>
            <h3 className="font-heading font-black text-3xl text-emerald-400 mt-1">
              {donations.length}
            </h3>
            <Link to="/donations" className="text-[10px] text-emerald-400 hover:underline">
              View donation history →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Active Campus Alerts */}
        <div className="glass-card p-5 flex items-center justify-between border border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Campus Requests</span>
            <h3 className="font-heading font-black text-3xl text-amber-400 mt-1">
              {activeRequests.length}
            </h3>
            <span className="text-[10px] text-slate-400">Hospital emergencies</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Actionable Matches */}
        <div className="glass-card p-5 flex items-center justify-between border border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Matched Requests</span>
            <h3 className="font-heading font-black text-3xl text-cyan-400 mt-1">
              {myMatches.length}
            </h3>
            <span className="text-[10px] text-cyan-300 font-semibold">
              {pendingMatches.length} awaiting response
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md">
            <Bell className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* EMERGENCY MATCHES ACTION SECTION (If matched requests exist) */}
      {myMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <h2 className="font-heading font-black text-xl text-white tracking-tight">
                Emergency Blood Matches for You
              </h2>
            </div>
            <span className="text-xs text-rose-400 font-bold">
              {pendingMatches.length} pending action
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMatches.map(match => (
              <div
                key={match.match_id}
                className="glass-card p-5 border border-rose-500/30 hover:border-rose-500/60 shadow-xl space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-heading font-black text-lg">
                      {match.blood_group}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-heading">{match.hospital_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {match.match_type === 'EXACT' ? '⭐ EXACT MATCH' : 'COMPATIBLE'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{match.hospital_address}</span>
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                    match.response === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    match.response === 'NOT_AVAILABLE' ? 'bg-slate-700 text-slate-400' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  }`}>
                    {match.response === 'AVAILABLE' ? '✓ Accepted' : match.response === 'NOT_AVAILABLE' ? 'Declined' : 'Pending Response'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Required Units</span>
                    <strong className="text-white font-bold">{match.units_required} Unit(s) ({match.component})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hospital Contact</span>
                    <strong className="text-rose-300 font-mono font-bold">{match.hospital_phone}</strong>
                  </div>
                </div>

                {match.response === 'PENDING' ? (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => handleRespondMatch(match.match_id, 'AVAILABLE')}
                      disabled={actionLoading === match.match_id}
                      className="btn-primary flex-1 py-2.5 text-xs font-bold shadow-md shadow-rose-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Can Donate (Accept)</span>
                    </button>
                    <button
                      onClick={() => handleRespondMatch(match.match_id, 'NOT_AVAILABLE')}
                      disabled={actionLoading === match.match_id}
                      className="btn-secondary py-2.5 px-4 text-xs font-semibold hover:bg-rose-950/30 hover:text-rose-300"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      Response recorded. Contact coordinator if status changes.
                    </span>
                    <button
                      onClick={() => handleRespondMatch(match.match_id, match.response === 'AVAILABLE' ? 'NOT_AVAILABLE' : 'AVAILABLE')}
                      className="text-xs text-rose-400 hover:underline font-bold"
                    >
                      Change to {match.response === 'AVAILABLE' ? 'Decline' : 'Accept'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Active Blood Requests Feed */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h2 className="font-heading font-black text-xl text-white">All Active Campus Requests</h2>
            </div>
            <Link to="/requests" className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1">
              <span>View All ({activeRequests.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="glass-card p-6 h-40 animate-pulse" />)}
            </div>
          ) : activeRequests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeRequests.slice(0, 4).map(req => (
                <BloodRequestCard key={req.id} request={req} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-slate-400 text-xs">
              No active blood requests at this moment.
            </div>
          )}
        </div>

        {/* Right: Recent Donation History & Eligibility Widget */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-xl text-white">Donation Record</h2>
            <Link to="/donations" className="text-xs text-slate-400 hover:text-white font-semibold">
              Full History →
            </Link>
          </div>

          <div className="glass-card p-5 space-y-4 border border-white/5">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Last Donation Date</span>
              <p className="font-heading font-bold text-base text-slate-200">
                {profile?.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : 'No previous records'}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-slate-300 block">Recent Verified Donations</span>
              {donations.length > 0 ? (
                donations.slice(0, 3).map(don => (
                  <div key={don.id} className="p-3 rounded-xl bg-white/5 flex items-center justify-between text-xs border border-white/5">
                    <div>
                      <strong className="text-slate-200 block">{don.hospital_name}</strong>
                      <span className="text-[10px] text-slate-400">{new Date(don.donation_date).toLocaleDateString()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                      {don.units} Unit
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-2">
                  When your donations are logged at campus health centers, they will be verified and displayed here.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

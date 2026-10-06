import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donorService } from '../services/donorService';
import { bloodRequestService } from '../services/bloodRequestService';
import { donationService } from '../services/donationService';
import { notificationService } from '../services/notificationService';
import BloodRequestCard from '../components/BloodRequestCard';
import { Heart, Activity, Bell, Calendar, ShieldCheck, ToggleLeft, ToggleRight, PlusCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Toast from '../components/Toast';

export default function StudentDashboard() {
  const { user, updateUserProfile } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [availability, setAvailability] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [profRes, reqRes, donRes, notifRes] = await Promise.all([
        donorService.getProfile(),
        bloodRequestService.getAllRequests(),
        donationService.getMyDonations(),
        notificationService.getUserNotifications()
      ]);

      if (profRes.success) {
        setProfile(profRes.profile);
        setAvailability(Boolean(profRes.profile.availability));
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

  return (
    <div className="space-y-8 py-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Banner & Quick Controls */}
      <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-l-rose-500">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              Welcome back, {user?.name || 'Student Donor'}! 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Department of {profile?.department || user?.department || 'Engineering'} • Student ID: <strong className="text-slate-200">{profile?.student_id || user?.studentId}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Availability Toggle Switch */}
          <button
            onClick={handleToggleAvailability}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${availability ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'}`}
          >
            {availability ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
            <span>{availability ? 'Available for Emergencies' : 'Marked Unavailable'}</span>
          </button>

          <Link to="/create-request" className="btn-primary text-xs py-2.5 px-4">
            <PlusCircle className="w-4 h-4" />
            <span>Create Request</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Blood Group */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Blood Group</span>
            <h3 className="font-heading font-extrabold text-3xl text-rose-500 mt-1">
              {profile?.blood_group || user?.bloodGroup || 'O+'}
            </h3>
            <span className="text-[10px] text-slate-500">Verified campus profile</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
        </div>

        {/* Total Donations */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Verified Donations</span>
            <h3 className="font-heading font-extrabold text-3xl text-emerald-400 mt-1">
              {donations.length}
            </h3>
            <Link to="/donations" className="text-[10px] text-emerald-400 hover:underline">
              View donation logs →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Active Campus Alerts */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Campus Requests</span>
            <h3 className="font-heading font-extrabold text-3xl text-amber-400 mt-1">
              {activeRequests.length}
            </h3>
            <span className="text-[10px] text-slate-500">Hospital emergencies</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Unread Notifications */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Emergency Notifications</span>
            <h3 className="font-heading font-extrabold text-3xl text-cyan-400 mt-1">
              {unreadNotifsCount}
            </h3>
            <Link to="/notifications" className="text-[10px] text-cyan-400 hover:underline">
              Check inbox →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Bell className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Active Blood Requests Feed */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h2 className="font-heading font-extrabold text-xl text-white">Active Blood Requests</h2>
            </div>
            <Link to="/requests" className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1">
              <span>View All</span>
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
            <h2 className="font-heading font-extrabold text-xl text-white">Donation Summary</h2>
            <Link to="/donations" className="text-xs text-slate-400 hover:text-white">
              History
            </Link>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Last Donation Date</span>
              <p className="font-heading font-bold text-base text-slate-200">
                {profile?.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : 'No prior campus records'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-300 block">Recent Verified Records</span>
              {donations.length > 0 ? (
                donations.slice(0, 3).map(don => (
                  <div key={don.id} className="p-3 rounded-xl bg-white/5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-200 block">{don.hospital_name}</strong>
                      <span className="text-[10px] text-slate-400">{new Date(don.donation_date).toLocaleDateString()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                      {don.units} Unit
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Your future verified donations will appear here.</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

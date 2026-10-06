import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Users, AlertTriangle, ShieldCheck, Heart, Activity, FileText, ArrowRight, Clock } from 'lucide-react';
import BloodRequestCard from '../components/BloodRequestCard';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = metrics?.stats || {};
  const bloodGroups = metrics?.bloodGroupDistribution || [];
  const recentRequests = metrics?.recentRequests || [];
  const recentLogs = metrics?.recentLogs || [];

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl text-white">Admin Command Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Live campus donor metrics, emergency broadcast dispatch, and donation audits</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/create-request" className="btn-primary text-xs py-2.5 px-4">
            <span>+ Broadcast Emergency Request</span>
          </Link>
          <Link to="/admin/reports" className="btn-secondary text-xs py-2.5 px-4">
            <span>Analytics Reports</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered Donors</span>
          <h3 className="font-heading font-black text-3xl text-white mt-1">{stats.totalDonors || 0}</h3>
          <span className="text-[10px] text-emerald-400">● {stats.availableDonors || 0} currently available</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Requests</span>
          <h3 className="font-heading font-black text-3xl text-amber-400 mt-1">{stats.activeRequests || 0}</h3>
          <span className="text-[10px] text-red-400">🚨 {stats.emergencyRequests || 0} critical emergency</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Donations</span>
          <h3 className="font-heading font-black text-3xl text-emerald-400 mt-1">{stats.completedDonations || 0}</h3>
          <span className="text-[10px] text-slate-400">{stats.totalUnitsDonated || 0} units collected</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Campus Coverage</span>
          <h3 className="font-heading font-black text-3xl text-rose-500 mt-1">8 / 8</h3>
          <span className="text-[10px] text-slate-400">All ABO & Rh groups represented</span>
        </div>
      </div>

      {/* Blood Group Distribution Grid */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-bold text-lg text-white mb-4">Live Blood Group Donor Inventory</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => {
            const found = bloodGroups.find(g => g.blood_group === bg);
            const count = found ? found.count : 0;
            return (
              <div key={bg} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                <span className="font-heading font-extrabold text-lg text-rose-400 block">{bg}</span>
                <span className="font-bold text-white text-sm">{count}</span>
                <span className="text-[10px] text-slate-500 block">donors</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requests & Audit Logs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Requests Monitor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-xl text-white">Live Requests Monitor</h3>
            <Link to="/requests" className="text-xs text-rose-400 hover:text-rose-300 font-bold">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentRequests.map(req => (
              <BloodRequestCard key={req.id} request={req} />
            ))}
          </div>
        </div>

        {/* Real-time Audit Trail */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-xl text-white">Live Audit Log</h3>
          <div className="glass-card p-4 space-y-3 max-h-[420px] overflow-y-auto">
            {recentLogs.length > 0 ? (
              recentLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-lg bg-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <strong className="font-mono text-[11px] text-rose-400">{log.action}</strong>
                    <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {log.user_name || 'System'} • {log.entity_type} #{log.entity_id}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No audit records yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

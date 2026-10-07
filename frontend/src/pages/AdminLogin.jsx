import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Shield, Lock, Mail, AlertCircle, Sparkles, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fillAdminCredentials = () => {
    setEmail('admin@campus.edu');
    setPassword('Admin@12345');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await authService.adminLogin({ email, password });
      if (res.success) {
        sounds.playSuccess();
        login(res.user, res.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="glass-card p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        
        {/* Top banner accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600" />
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6 relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-700/30 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-lg shadow-amber-950/40">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-black text-2xl text-white">Campus Admin Command</h2>
          <p className="text-xs text-slate-400 mt-1">Authorized health center staff and emergency coordinators</p>
          
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] text-amber-300 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>1-Click Fill Admin Credentials</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 relative z-10 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Authorized Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="admin@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-xl shadow-amber-950/40 transition-all text-xs cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Enter Admin Command Console</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <Link to="/login" className="hover:text-white">
            ← Student Donor Login
          </Link>
          <span className="text-[11px] text-amber-400/80 font-mono">Role: ADMIN</span>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Shield, User, Sparkles, ChevronDown, ChevronUp, Droplet, LogIn } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function QuickDemoBar() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [loadingUser, setLoadingUser] = useState(null);

  const demoAccounts = [
    {
      role: 'ADMIN',
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      password: 'Admin@12345',
      badge: 'Admin Command Center',
      bg: 'O+',
      color: 'from-amber-500 to-orange-600',
      isAdmin: true
    },
    {
      role: 'STUDENT',
      name: 'John Doe',
      email: 'john.doe@campus.edu',
      password: 'Admin@12345',
      badge: 'O+ Donor (CS Dept)',
      bg: 'O+',
      color: 'from-rose-600 to-red-700'
    },
    {
      role: 'STUDENT',
      name: 'Jane Smith',
      email: 'jane.smith@campus.edu',
      password: 'Admin@12345',
      badge: 'A+ Donor (ECE Dept)',
      bg: 'A+',
      color: 'from-blue-600 to-indigo-700'
    },
    {
      role: 'STUDENT',
      name: 'Priya Patel',
      email: 'priya.p@campus.edu',
      password: 'Admin@12345',
      badge: 'O- Universal Donor (Biotech)',
      bg: 'O-',
      color: 'from-emerald-600 to-teal-700'
    }
  ];

  const handleQuickLogin = async (acc) => {
    setLoadingUser(acc.email);
    try {
      let res;
      if (acc.isAdmin) {
        res = await authService.adminLogin({ email: acc.email, password: acc.password });
      } else {
        res = await authService.login({ emailOrPhone: acc.email, password: acc.password });
      }

      if (res.success) {
        sounds.playSuccess();
        login(res.user, res.token);
        navigate(res.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      console.error('Quick demo login error:', err);
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="glass-card border border-rose-500/30 shadow-2xl backdrop-blur-2xl overflow-hidden rounded-2xl transition-all duration-300">
        
        {/* Toggle Bar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-gradient-to-r from-[#172033] to-[#1e293b] hover:from-[#1e2b45] hover:to-[#26354d] transition-all w-full text-left"
        >
          <div className="w-5 h-5 rounded-lg bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-heading">1-Click Demo Accounts</span>
          {user && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
              Logged in: {user.name} ({user.role})
            </span>
          )}
          <span className="ml-auto text-slate-400">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>

        {/* Dropdown list */}
        {expanded && (
          <div className="p-3 space-y-2 border-t border-white/10 bg-[#0c101c]/95 max-w-xs">
            <p className="text-[11px] text-slate-400 mb-1">
              Switch roles instantly to test real-time emergency broadcasts and donor actions:
            </p>

            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleQuickLogin(acc)}
                disabled={loadingUser === acc.email}
                className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-rose-500/30 flex items-center justify-between gap-3 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {acc.isAdmin ? <Shield className="w-3.5 h-3.5" /> : acc.bg}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors block">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{acc.badge}</span>
                  </div>
                </div>

                <LogIn className="w-4 h-4 text-slate-400 group-hover:text-rose-400 shrink-0" />
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { Heart, Bell, User, LogOut, Shield, PlusCircle, Droplet, Menu, X, Sparkles, Activity } from 'lucide-react';
import CompatibilityMatrixModal from './CompatibilityMatrixModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path) => location.pathname === path;

  // Fetch unread count for logged-in students
  useEffect(() => {
    if (user?.role === 'STUDENT') {
      notificationService.getNotifications()
        .then(res => setUnreadCount(res.unreadCount || 0))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  return (
    <>
      <CompatibilityMatrixModal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
      />

      <header className="sticky top-0 z-40 px-4 py-3 bg-[#0a0d14]/90 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div>
              <span className="font-heading font-black text-xl text-white tracking-tight flex items-center gap-1.5">
                Campus <span className="text-rose-500">BloodConnect</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-0.5">
                Real-Time Donor Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/requests"
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/requests') ? 'text-rose-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}
            >
              Blood Requests
            </Link>

            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              <span>Blood Matrix</span>
            </button>

            {user?.role === 'STUDENT' && (
              <>
                <Link
                  to="/dashboard"
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/dashboard') ? 'text-rose-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/donations"
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/donations') ? 'text-rose-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}
                >
                  My Donations
                </Link>
                <Link
                  to="/notifications"
                  className={`relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors ${isActive('/notifications') ? 'text-rose-400 bg-white/5' : ''}`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/admin/dashboard') ? 'text-rose-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}
                >
                  Admin Control
                </Link>
                <Link
                  to="/admin/donors"
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/admin/donors') ? 'text-rose-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}
                >
                  Donor Directory
                </Link>
                <Link
                  to="/admin/reports"
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${isActive('/admin/reports') ? 'text-rose-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}
                >
                  Reports & Stats
                </Link>
              </>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/create-request"
                  className="btn-primary text-xs py-2 px-3.5 shadow-md shadow-rose-600/30"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Request Blood</span>
                </Link>

                {user.role === 'STUDENT' && (
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold text-slate-200"
                  >
                    <User className="w-3.5 h-3.5 text-rose-400" />
                    <span>{user?.name ? user.name.split(' ')[0] : 'Donor'}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                      {user?.bloodGroup || 'Donor'}
                    </span>
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin</span>
                  </span>
                )}

                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn-secondary text-xs py-2 px-3.5">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary text-xs py-2 px-4 shadow-md shadow-rose-600/30">
                  Register as Donor
                </Link>
                <Link
                  to="/admin/login"
                  className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Admin Command Portal"
                >
                  <Shield className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-white/10 mt-3 flex flex-col gap-2.5 animate-in slide-in-from-top-4">
            <Link
              to="/requests"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              Blood Requests
            </Link>

            <button
              type="button"
              onClick={() => { setShowMatrixModal(true); setMobileMenuOpen(false); }}
              className="px-3 py-2 text-left rounded-xl text-sm font-semibold text-rose-400 hover:bg-white/5 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>Blood Compatibility Matrix</span>
            </button>

            {user?.role === 'STUDENT' && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Student Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  My Profile
                </Link>
                <Link
                  to="/donations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Donation History
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Notifications ({unreadCount})
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Admin Control Panel
                </Link>
                <Link
                  to="/admin/donors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Donor Directory
                </Link>
                <Link
                  to="/admin/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Analytics & Reports
                </Link>
              </>
            )}

            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="btn-danger w-full text-center text-xs py-2.5"
                >
                  Log Out ({user.name})
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary w-full text-center text-xs py-2.5"
                  >
                    Log In with Mobile OTP / Password
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full text-center text-xs py-2.5"
                  >
                    Register as Donor
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

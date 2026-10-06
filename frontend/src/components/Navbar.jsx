import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Bell, User, LogOut, Shield, PlusCircle, Droplet, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 px-4 py-3 bg-[#0a0d14]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl text-white tracking-tight flex items-center gap-1.5">
              Campus <span className="text-rose-500">BloodConnect</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
              Emergency Donor Network
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/requests"
            className={`text-sm font-medium transition-colors ${isActive('/requests') ? 'text-rose-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
          >
            Blood Requests
          </Link>

          {user?.role === 'STUDENT' && (
            <>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-rose-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                Dashboard
              </Link>
              <Link
                to="/donations"
                className={`text-sm font-medium transition-colors ${isActive('/donations') ? 'text-rose-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                My Donations
              </Link>
              <Link
                to="/notifications"
                className={`relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors ${isActive('/notifications') ? 'text-rose-400 bg-white/5' : ''}`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`text-sm font-medium transition-colors ${isActive('/admin/dashboard') ? 'text-rose-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                Admin Control
              </Link>
              <Link
                to="/admin/donors"
                className={`text-sm font-medium transition-colors ${isActive('/admin/donors') ? 'text-rose-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                Donor Directory
              </Link>
              <Link
                to="/admin/reports"
                className={`text-sm font-medium transition-colors ${isActive('/admin/reports') ? 'text-rose-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                Analytics & Reports
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
                className="btn-primary text-xs py-2 px-3.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Request Blood</span>
              </Link>

              {user.role === 'STUDENT' && (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-semibold text-slate-200"
                >
                  <User className="w-4 h-4 text-rose-400" />
                  <span>{user.name?.split(' ')[0]}</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                    {user.bloodGroup || 'Donor'}
                  </span>
                </Link>
              )}

              {user.role === 'ADMIN' && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </span>
              )}

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs py-2 px-3.5">
                Log In
              </Link>
              <Link to="/register" className="btn-primary text-xs py-2 px-3.5">
                Register as Donor
              </Link>
              <Link
                to="/admin/login"
                className="p-2 text-slate-400 hover:text-white"
                title="Admin Portal"
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
        <div className="md:hidden pt-4 pb-3 border-t border-white/10 mt-3 flex flex-col gap-3">
          <Link
            to="/requests"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
          >
            Blood Requests
          </Link>
          {user?.role === 'STUDENT' && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
              >
                My Profile
              </Link>
              <Link
                to="/donations"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
              >
                Donation History
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
              >
                Notifications
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/donors"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
              >
                Donor Management
              </Link>
              <Link
                to="/admin/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-200 hover:bg-white/5"
              >
                Reports
              </Link>
            </>
          )}

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="btn-danger w-full text-center"
              >
                Log Out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary w-full text-center"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Register as Donor
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

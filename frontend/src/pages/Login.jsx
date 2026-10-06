import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { sendPhoneOtp, verifyPhoneOtp, isFirebaseConfigured } from '../config/firebase';
import { normalizePhoneNumber } from '../utils/validation';
import { Heart, Smartphone, Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import Toast from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('password'); // 'password' or 'phone_otp'
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await authService.login({ emailOrPhone, password });
      if (res.success) {
        login(res.user, res.token);
        navigate(res.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const normalized = normalizePhoneNumber(phone);

    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        await sendPhoneOtp(normalized, 'recaptcha-login-container');
        setToast({ message: `Real SMS OTP dispatched to ${normalized}`, type: 'success' });
      } else {
        setToast({ message: 'Dev Mode: Enter test OTP (123456)', type: 'success' });
      }
      setOtpSent(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch phone OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let firebaseToken = null;
      if (isFirebaseConfigured()) {
        const result = await verifyPhoneOtp(otpCode);
        firebaseToken = result.idToken;
      } else {
        firebaseToken = 'dev_token_' + Date.now();
      }

      const res = await authService.login({ firebaseToken });
      if (res.success) {
        login(res.user, res.token);
        navigate(res.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Phone verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div id="recaptcha-login-container"></div>

      <div className="glass-card p-8 border border-white/10 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-500">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Student Donor Login</h2>
          <p className="text-xs text-slate-400 mt-1">Access your campus donor dashboard and emergency requests</p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('password'); setErrorMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${mode === 'password' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('phone_otp'); setErrorMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${mode === 'phone_otp' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Phone SMS OTP
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email or Phone</label>
              <input
                type="text"
                required
                placeholder="student@campus.edu"
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs font-bold mt-2">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        ) : (
          !otpSent ? (
            <form onSubmit={handleSendPhoneOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Verified Phone Number</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs font-bold mt-2">
                {loading ? 'Sending SMS OTP...' : 'Send Login OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-white/5 text-center text-xs text-slate-300">
                OTP sent to <strong className="text-rose-400">{phone}</strong>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/20 text-white text-center font-mono text-lg tracking-[0.2em] font-bold focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
              <button type="submit" disabled={loading || otpCode.length < 6} className="btn-primary w-full py-2.5 text-xs font-bold">
                {loading ? 'Verifying...' : 'Confirm OTP & Log In'}
              </button>
              <button type="button" onClick={() => setOtpSent(false)} className="text-xs text-slate-400 hover:text-white block mx-auto pt-1">
                Change phone number
              </button>
            </form>
          )
        )}

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <Link to="/register" className="text-rose-400 hover:text-rose-300 font-bold">
            Create New Account
          </Link>
          <Link to="/admin/login" className="text-slate-400 hover:text-white">
            Admin Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}

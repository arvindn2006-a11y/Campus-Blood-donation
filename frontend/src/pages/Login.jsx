import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { normalizePhoneNumber } from '../utils/validation';
import { Heart, Smartphone, Lock, KeyRound, AlertCircle, ArrowRight, RotateCw, CheckCircle2, Sparkles, Shield } from 'lucide-react';
import Toast from '../components/Toast';
import SmsNotificationHud from '../components/SmsNotificationHud';
import { sounds } from '../utils/soundEffects';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('phone_otp'); // 'phone_otp' or 'password'
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [activeOtpPayload, setActiveOtpPayload] = useState(null);

  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  // Handle Google OAuth Callback params if returning from Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      sounds.playError?.();
    } else if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        login(user, token);
        sounds.playSuccess();
        navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', { replace: true });
      } catch (err) {
        console.error('Failed to parse Google OAuth user payload:', err);
      }
    }
  }, [login, navigate]);

  // Handle Send Real-Time OTP for Login
  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const normalized = normalizePhoneNumber(phone);
    if (!normalized || normalized.length < 10) {
      setErrorMsg('Please enter a valid mobile number with country code (e.g. +919876543210).');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.sendOtp({
        phone: normalized,
        purpose: 'LOGIN'
      });

      if (res.success) {
        sounds.playOtpArrival();
        const code = res.otpCode || res.previewOtp || res.otp;
        setActiveOtpPayload({
          otpCode: code,
          phone: normalized,
          provider: res.provider
        });

        setToast({
          message: `OTP generated successfully for ${normalized}`,
          type: 'success'
        });

        setOtpSent(true);
        setResendTimer(60);
        setOtpDigits(['', '', '', '', '', '']);

        setTimeout(() => {
          if (inputRefs.current[0]) inputRefs.current[0].focus();
        }, 150);
      }
    } catch (err) {
      console.error('Login OTP Error:', err);
      setErrorMsg(err.message || 'Failed to generate phone OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 5);
      if (inputRefs.current[focusIndex]) inputRefs.current[focusIndex].focus();
    }
  };

  const handleAutoFill = (code) => {
    if (!code) return;
    const digits = String(code).split('').slice(0, 6);
    setOtpDigits(digits);
    setToast({ message: 'OTP code auto-filled!', type: 'success' });
    if (inputRefs.current[5]) inputRefs.current[5].focus();
  };

  // Verify Phone OTP Login
  const handleVerifyPhoneLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      const normalized = normalizePhoneNumber(phone);
      const res = await authService.phoneLogin({
        phone: normalized,
        otpCode: enteredOtp
      });

      if (res.success) {
        sounds.playSuccess();
        login(res.user, res.token);
        navigate(res.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      console.error('Phone login error:', err);
      setErrorMsg(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await authService.login({ emailOrPhone, password });
      if (res.success) {
        sounds.playSuccess();
        login(res.user, res.token);
        navigate(res.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill demo phone
  const fillSamplePhone = (sampleNumber) => {
    setPhone(sampleNumber);
    setToast({ message: `Pre-filled sample phone: ${sampleNumber}`, type: 'info' });
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Real-time SMS Notification HUD */}
      <SmsNotificationHud
        activeOtp={activeOtpPayload}
        onAutoFill={handleAutoFill}
        onClose={() => setActiveOtpPayload(null)}
      />

      <div className="glass-card p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-700/30 border border-rose-500/40 flex items-center justify-center mx-auto mb-3 text-rose-500 shadow-lg shadow-rose-950/40">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <h2 className="font-heading font-black text-2xl text-white">Student Donor Login</h2>
          <p className="text-xs text-slate-400 mt-1">Access your campus donor dashboard and emergency requests</p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl mb-6 relative z-10">
          <button
            type="button"
            onClick={() => { setMode('phone_otp'); setErrorMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${mode === 'phone_otp' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone OTP Login</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('password'); setErrorMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${mode === 'password' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password Login</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 relative z-10 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'phone_otp' ? (
          !otpSent ? (
            <form onSubmit={handleSendLoginOtp} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Registered Mobile Number</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                  <span>Quick Test Numbers:</span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => fillSamplePhone('+919876543210')} className="text-rose-400 hover:underline">John (+919876543210)</button>
                    <button type="button" onClick={() => fillSamplePhone('+919876543211')} className="text-rose-400 hover:underline">Jane (+919876543211)</button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-xs font-bold mt-2 shadow-lg shadow-rose-600/30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Generating OTP...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Generate OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneLogin} className="space-y-4 relative z-10">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-center text-xs text-slate-300">
                OTP sent to <strong className="text-rose-300 font-mono">{phone}</strong>
              </div>

              {/* In-Form Highlighted Generated OTP Display Card */}
              {activeOtpPayload?.otpCode && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 flex items-center justify-between gap-2 text-left animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-300 font-medium">Your Generated OTP:</div>
                      <div className="text-xl font-black font-mono tracking-widest text-emerald-300">
                        {activeOtpPayload.otpCode}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFill(activeOtpPayload.otpCode)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black shadow-md flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fill OTP</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2.5 text-center uppercase tracking-wider">
                  Enter OTP
                </label>
                <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoFocus={idx === 0}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 text-center font-mono font-black text-xl rounded-xl bg-white/5 border border-white/20 text-rose-300 focus:outline-none focus:border-rose-500 focus:bg-rose-500/10 transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="btn-primary w-full py-3 text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Verifying OTP & Logging In...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Verify OTP & Log In
                  </span>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="hover:text-white cursor-pointer"
                >
                  ← Change Number
                </button>
                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleSendLoginOtp}
                  className="text-rose-400 hover:text-rose-300 disabled:opacity-40 font-bold cursor-pointer"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Campus Email or Phone</label>
              <input
                type="text"
                required
                placeholder="john.doe@campus.edu"
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default test password: Admin@12345</span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-xs font-bold mt-2 shadow-lg shadow-rose-600/30">
              {loading ? 'Logging in...' : 'Log In with Password'}
            </button>
          </form>
        )}

        {/* Google OAuth Login Option */}
        <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
          <div className="relative flex py-1.5 items-center mb-3">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <a
            href="/api/auth/google"
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-md hover:border-white/30"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.5 0 12.8s.6 4.5 1.6 6.4l3.7-4.5z" />
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16.4C3.5 20.2 7.4 23.5 12 23.5z" />
            </svg>
            <span>Sign in with Google</span>
          </a>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
          <Link to="/register" className="text-rose-400 hover:text-rose-300 font-bold">
            Create Donor Account
          </Link>
          <Link to="/admin/login" className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Portal →</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

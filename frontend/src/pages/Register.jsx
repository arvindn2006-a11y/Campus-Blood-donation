import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { normalizePhoneNumber, validateEmail } from '../utils/validation';
import { Heart, Smartphone, KeyRound, Shield, Check, AlertCircle, ArrowRight, RotateCw, Sparkles, CheckCircle2, Copy } from 'lucide-react';
import Toast from '../components/Toast';
import SmsNotificationHud from '../components/SmsNotificationHud';
import { sounds } from '../utils/soundEffects';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    studentId: '',
    department: 'Computer Science & Engineering',
    year: 1,
    bloodGroup: 'O+',
    consent: false
  });

  // Step 1 = Details & Phone input, Step 2 = 6-digit OTP verification
  const [step, setStep] = useState(1);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [verificationToken, setVerificationToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [activeOtpPayload, setActiveOtpPayload] = useState(null);

  // Input refs for 6-digit OTP boxes
  const inputRefs = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Handle Send Real-Time OTP to entered mobile number
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.studentId.trim()) {
      setErrorMsg('Please fill in all mandatory profile fields before requesting SMS OTP.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrorMsg('Please enter a valid campus email address (e.g. name@campus.edu).');
      return;
    }

    const normalized = normalizePhoneNumber(formData.phone);
    if (!normalized || normalized.length < 10) {
      setErrorMsg('Please enter a valid mobile number with country code (e.g. +919876543210).');
      return;
    }

    if (!formData.consent) {
      setErrorMsg('Please accept the emergency donor network consent agreement.');
      return;
    }

    setLoading(true);

    try {
      // Call backend OTP Engine
      const otpRes = await authService.sendOtp({
        phone: normalized,
        email: formData.email.trim(),
        name: formData.name.trim(),
        purpose: 'REGISTER'
      });

      if (otpRes.success) {
        sounds.playOtpArrival();
        const code = otpRes.otpCode || otpRes.previewOtp || otpRes.otp;
        setActiveOtpPayload({
          otpCode: code,
          phone: normalized,
          provider: otpRes.provider
        });

        setToast({
          message: `OTP generated successfully for ${normalized}`,
          type: 'success'
        });

        setStep(2);
        setResendTimer(60);
        setOtpDigits(['', '', '', '', '', '']);

        // Focus first OTP box
        setTimeout(() => {
          if (inputRefs.current[0]) inputRefs.current[0].focus();
        }, 150);
      }
    } catch (err) {
      console.error('OTP Send Error:', err);
      setErrorMsg(err.message || 'Failed to generate OTP. Please verify your mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP box inputs
  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto advance to next box
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
    setToast({ message: 'OTP auto-filled successfully!', type: 'success' });
    if (inputRefs.current[5]) inputRefs.current[5].focus();
  };

  // Verify OTP and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);

    try {
      const normalized = normalizePhoneNumber(formData.phone);

      // 1. Verify OTP with Backend
      const verifyRes = await authService.verifyOtp({
        phone: normalized,
        otpCode: enteredOtp,
        purpose: 'REGISTER'
      });

      if (!verifyRes.success) {
        throw new Error(verifyRes.message || 'OTP verification failed');
      }

      // 2. Complete Donor Profile Registration
      const regRes = await authService.register({
        verificationToken: verifyRes.verificationToken,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: normalized,
        password: formData.password,
        studentId: formData.studentId.trim(),
        department: formData.department,
        year: formData.year,
        bloodGroup: formData.bloodGroup
      });

      if (regRes.success) {
        sounds.playSuccess();
        login(regRes.user, regRes.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Verification failed. Please check the code and retry.');
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill helper
  const fillDemoData = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      name: 'Kavya Sharma',
      email: `kavya.${randomNum}@campus.edu`,
      phone: `+9198765${randomNum}`,
      password: 'Donor@12345',
      studentId: `CS2026${randomNum.toString().slice(0, 3)}`,
      department: 'Computer Science & Engineering',
      year: 2,
      bloodGroup: 'B+',
      consent: true
    });
    setToast({ message: 'Pre-filled sample student donor details!', type: 'info' });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Real-time SMS Notification HUD */}
      <SmsNotificationHud
        activeOtp={activeOtpPayload}
        onAutoFill={handleAutoFill}
        onClose={() => setActiveOtpPayload(null)}
      />

      <div className="glass-card p-6 sm:p-9 border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-700/30 border border-rose-500/40 flex items-center justify-center mx-auto mb-3.5 text-rose-500 shadow-lg shadow-rose-900/30">
            <Heart className="w-7 h-7 fill-rose-500" />
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
            Register as Campus Donor
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
            {step === 1
              ? 'Join our campus life-saving network with verified mobile OTP authentication.'
              : 'Enter the 6-digit verification OTP sent to your phone and email.'}
          </p>

          {step === 1 && (
            <button
              type="button"
              onClick={fillDemoData}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Fill Sample Donor</span>
            </button>
          )}
        </div>

        {/* Progress Pills */}
        <div className="flex items-center justify-center gap-3 mb-7 relative z-10">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${step === 1 ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-white/5 text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-white/20 text-center leading-4 text-[10px]">1</span>
            <span>Donor Details</span>
          </div>
          <div className="w-6 h-0.5 bg-white/10" />
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${step === 2 ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-white/5 text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-white/20 text-center leading-4 text-[10px]">2</span>
            <span>Enter OTP</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 relative z-10 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Registration Profile Fields */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 relative z-10">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Carter"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Student Roll / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS2026042"
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Blood Group *</label>
                <select
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-rose-500 transition-colors"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Academic Year *</label>
                <select
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                >
                  <option value={1}>1st Year (Freshman)</option>
                  <option value={2}>2nd Year (Sophomore)</option>
                  <option value={3}>3rd Year (Junior)</option>
                  <option value={4}>4th Year (Senior)</option>
                  <option value={5}>Postgraduate / Scholar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Department / Faculty *</label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science & Engineering"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Campus Email Address *</label>
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Enter your 10-digit mobile number with country code (e.g. +919876543210).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Account Password (Optional)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="consent"
                required
                checked={formData.consent}
                onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                className="mt-1 rounded bg-white/10 border-white/20 text-rose-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="consent" className="text-xs text-slate-300 leading-snug cursor-pointer">
                I volunteer as a verified campus blood donor and consent to receive emergency alert broadcasts when matching requirements arise.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-4 text-sm font-bold shadow-xl shadow-rose-600/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Generating OTP...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Generate OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

            {/* Google OAuth Option */}
            <div className="pt-2">
              <div className="relative flex py-1.5 items-center mb-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">or sign up with</span>
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
                <span>Continue with Google</span>
              </a>
            </div>
          </form>
        )}

        {/* STEP 2: OTP Verification Screen */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-5 relative z-10">
            
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/30 to-purple-950/20 border border-rose-500/20 text-center">
              <span className="text-xs text-slate-400 block mb-1">OTP sent to mobile number</span>
              <strong className="text-base sm:text-lg text-rose-300 font-mono tracking-wider font-bold">
                {formData.phone}
              </strong>
            </div>

            {/* In-Form Highlighted Generated OTP Display Card */}
            {activeOtpPayload?.otpCode && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-xl shadow-emerald-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Generated OTP Code:
                    </div>
                    <div className="text-2xl font-black font-mono tracking-widest text-emerald-300">
                      {activeOtpPayload.otpCode}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAutoFill(activeOtpPayload.otpCode)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fill OTP</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-3 text-center uppercase tracking-wider">
                Enter OTP
              </label>

              {/* 6 Individual Box Inputs */}
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
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
                    className="w-11 h-13 sm:w-13 sm:h-15 text-center font-mono font-black text-xl sm:text-2xl rounded-xl bg-white/5 border border-white/20 text-rose-300 focus:outline-none focus:border-rose-500 focus:bg-rose-500/10 transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 6}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-rose-600/30"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Verifying OTP & Registering...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Verify OTP & Complete Registration
                </span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                ← Edit Details
              </button>

              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleSendOtp}
                className="text-rose-400 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-400 relative z-10">
          Already registered as a campus donor?{' '}
          <Link to="/login" className="text-rose-400 font-bold hover:text-rose-300">
            Log In Here
          </Link>
        </div>

      </div>
    </div>
  );
}

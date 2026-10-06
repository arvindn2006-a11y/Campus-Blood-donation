import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { sendPhoneOtp, verifyPhoneOtp, isFirebaseConfigured } from '../config/firebase';
import { normalizePhoneNumber, validateE164Phone, validateEmail } from '../utils/validation';
import { Heart, Smartphone, KeyRound, Shield, Check, AlertCircle, ArrowRight, RotateCw } from 'lucide-react';
import Toast from '../components/Toast';

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

  // OTP Step State (step 1 = details, step 2 = OTP verification)
  const [step, setStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.email || !formData.phone || !formData.studentId) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrorMsg('Please enter a valid campus email address.');
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.phone);
    if (!validateE164Phone(normalizedPhone)) {
      setErrorMsg('Please enter a valid phone number with country code (e.g. +919876543210).');
      return;
    }

    if (!formData.consent) {
      setErrorMsg('You must consent to being contacted for emergency blood donations.');
      return;
    }

    setLoading(true);

    try {
      if (isFirebaseConfigured()) {
        // Real Firebase Phone OTP Flow
        await sendPhoneOtp(normalizedPhone, 'recaptcha-container');
        setToast({ message: `Real SMS OTP sent to ${normalizedPhone}`, type: 'success' });
      } else {
        // If developer hasn't pasted Firebase keys yet, show guidance
        console.warn('Firebase config missing. Using development test verification mode.');
        setToast({ message: 'Development Mode: Enter any 6-digit test code (e.g. 123456)', type: 'success' });
      }

      setStep(2);
      setResendTimer(60);
    } catch (err) {
      console.error('OTP Send Error:', err);
      setErrorMsg(err.message || 'Failed to send SMS OTP. Please verify phone number and Firebase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please enter the complete 6-digit SMS OTP.');
      return;
    }

    setLoading(true);

    try {
      let firebaseToken = null;

      if (isFirebaseConfigured()) {
        const result = await verifyPhoneOtp(otpCode);
        firebaseToken = result.idToken;
      } else {
        firebaseToken = 'dev_token_' + Date.now();
      }

      const normalizedPhone = normalizePhoneNumber(formData.phone);

      // Register with Backend API and MySQL
      const registerRes = await authService.register({
        firebaseToken,
        name: formData.name,
        email: formData.email,
        phone: normalizedPhone,
        password: formData.password,
        studentId: formData.studentId,
        department: formData.department,
        year: formData.year,
        bloodGroup: formData.bloodGroup
      });

      if (registerRes.success) {
        login(registerRes.user, registerRes.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Verification/Registration Error:', err);
      setErrorMsg(err.message || 'Verification failed. Please check the OTP code and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="glass-card p-6 sm:p-8 border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-500">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Join as a Campus Donor</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {step === 1 ? 'Verify your phone number with real SMS OTP to activate your donor profile.' : 'Enter the 6-digit OTP sent to your phone.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Registration Profile Fields */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student Roll / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS2026042"
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Blood Group *</label>
                <select
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Year *</label>
                <select
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>Postgraduate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department *</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email *</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number (E.164 Format for Real SMS OTP) *</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Include country code (e.g. +91 for India, +1 for USA) for real SMS delivery.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Password (Optional)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="consent"
                required
                checked={formData.consent}
                onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                className="mt-1 rounded bg-white/10 border-white/20 text-rose-600 focus:ring-0"
              />
              <label htmlFor="consent" className="text-xs text-slate-300 leading-snug">
                I agree to receive emergency campus blood alerts and confirm that the details provided are accurate.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 text-sm font-bold"
            >
              {loading ? 'Sending Real SMS OTP...' : 'Send SMS OTP & Verify'}
            </button>
          </form>
        )}

        {/* STEP 2: Real OTP Verification Screen */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpAndRegister} className="space-y-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-xs text-slate-400 block">OTP Sent to</span>
              <strong className="text-base text-rose-400 font-mono">{formData.phone}</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative max-w-[240px] mx-auto">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white text-center font-mono text-xl tracking-[0.3em] font-bold focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="btn-primary w-full py-3 text-sm font-bold"
            >
              {loading ? 'Verifying OTP & Creating Profile...' : 'Confirm OTP & Complete Registration'}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hover:text-white"
              >
                ← Edit Information
              </button>

              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleSendOtp}
                className="text-rose-400 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
          Already registered as a donor?{' '}
          <Link to="/login" className="text-rose-400 font-bold hover:text-rose-300">
            Log In Here
          </Link>
        </div>

      </div>
    </div>
  );
}

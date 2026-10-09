import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { normalizePhoneNumber, validateEmail } from '../utils/validation';
import { Heart, Smartphone, Shield, AlertCircle, ArrowRight, RotateCw, CheckCircle2, User, Mail, BookOpen, GraduationCap } from 'lucide-react';
import Toast from '../components/Toast';
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

  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Handle Send OTP to entered mobile number
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.studentId.trim()) {
      setErrorMsg('Please fill in all mandatory profile fields before requesting verification.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrorMsg('Please enter a valid campus or personal email address.');
      return;
    }

    const normalized = normalizePhoneNumber(formData.phone);
    if (!normalized || normalized.length < 10) {
      setErrorMsg('Please enter a valid mobile number with country code (e.g. +919876543210).');
      return;
    }

    if (!formData.consent) {
      setErrorMsg('Please acknowledge donor volunteer consent.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.sendOtp({
        phone: normalized,
        email: formData.email.trim(),
        name: formData.name.trim(),
        purpose: 'REGISTER'
      });

      if (res.success) {
        sounds.playOtpArrival();
        setToast({
          message: `Verification code dispatched to ${normalized}`,
          type: 'success'
        });
        setStep(2);
        setResendTimer(60);
        setOtpDigits(['', '', '', '', '', '']);

        setTimeout(() => {
          if (inputRefs.current[0]) inputRefs.current[0].focus();
        }, 150);
      }
    } catch (err) {
      console.error('Registration OTP Error:', err);
      setErrorMsg(err.message || 'Failed to dispatch verification OTP.');
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

  // Verify OTP and Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(formData.phone);
      
      // Verify OTP with Backend
      const verifyRes = await authService.verifyOtp({
        phone: normalizedPhone,
        otpCode: enteredOtp,
        purpose: 'REGISTER'
      });

      if (!verifyRes.success || !verifyRes.verificationToken) {
        throw new Error(verifyRes.message || 'OTP verification could not be completed.');
      }

      setVerificationToken(verifyRes.verificationToken);

      // Complete Profile Registration
      const regPayload = {
        verificationToken: verifyRes.verificationToken,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: normalizedPhone,
        password: formData.password || undefined,
        studentId: formData.studentId.trim().toUpperCase(),
        department: formData.department,
        year: parseInt(formData.year, 10),
        bloodGroup: formData.bloodGroup
      };

      const regRes = await authService.register(regPayload);

      if (regRes.success) {
        sounds.playSuccess();
        login(regRes.user, regRes.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please check the entered code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="glass-card p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden">

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-500 shadow-md">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-white tracking-tight">Register as Campus Blood Donor</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Join the automated campus emergency donor registry and receive verified alerts when matching blood is needed.
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className={`flex items-center gap-2 text-xs font-semibold ${step === 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'}`}>
                {step === 1 ? '1' : '✓'}
              </div>
              <span>Profile Details</span>
            </div>

            <div className="w-8 h-px bg-white/10" />

            <div className={`flex items-center gap-2 text-xs font-semibold ${step === 2 ? 'text-rose-400' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' : 'bg-white/5 border border-white/10 text-slate-400'}`}>
                2
              </div>
              <span>Phone Verification</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Details Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="jane.doe@campus.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Phone (for SMS Alerts) *</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student Roll / ID Number *</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="CS2024001"
                    value={formData.studentId}
                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs font-mono uppercase focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Blood Group *</label>
                <select
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department *</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="Computer Science & Engineering">Computer Science</option>
                  <option value="Electronics & Communication">Electronics & Comm.</option>
                  <option value="Electrical & Electronics">Electrical</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Civil Engineering">Civil</option>
                  <option value="Medicine & Health Sciences">Health Sciences</option>
                  <option value="Management & Commerce">Management</option>
                  <option value="Other Department">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Year *</label>
                <select
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Password (Optional)</label>
              <input
                type="password"
                placeholder="Set a password for standard login or leave blank for OTP-only access"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-white/5 mt-2">
              <input
                type="checkbox"
                id="consent"
                required
                checked={formData.consent}
                onChange={e => setFormData({ ...formData, consent: e.target.checked })}
                className="mt-0.5 rounded border-white/20 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="consent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                I volunteer as a verified campus donor and consent to receive emergency broadcast notifications when compatible blood is required.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-semibold shadow-lg shadow-rose-600/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Sending Verification Code...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span>Continue to Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

            {/* Google OAuth Option */}
            <div className="pt-2">
              <div className="relative flex py-1.5 items-center mb-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">or</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <a
                href="/api/auth/google"
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm hover:border-white/20"
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
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-xs text-slate-400 block mb-1">A 6-digit verification code was dispatched to</span>
              <strong className="text-base text-white font-mono font-bold tracking-wider">
                {formData.phone}
              </strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2.5 text-center uppercase tracking-wider text-[11px]">
                Enter 6-Digit Code
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
                    className="w-10 h-12 text-center font-mono font-bold text-lg rounded-xl bg-slate-900/90 border border-white/15 text-rose-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 6}
              className="btn-primary w-full py-3 text-xs font-semibold shadow-lg shadow-rose-600/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Verifying & Registering...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Verify & Create Donor Account
                </span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                ← Edit Profile Details
              </button>
              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={handleSendOtp}
                className="text-rose-400 hover:text-rose-300 disabled:opacity-40 font-medium transition-colors cursor-pointer"
              >
                {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-400 relative z-10">
          Already registered as a campus donor?{' '}
          <Link to="/login" className="text-rose-400 font-semibold hover:text-rose-300 transition-colors">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
}

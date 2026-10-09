import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { donorService } from '../services/donorService';
import { authService } from '../services/authService';
import { normalizePhoneNumber } from '../utils/validation';
import { User, BookOpen, Heart, Shield, Smartphone, Mail, AlertCircle, RotateCw, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';
import Toast from '../components/Toast';
import { sounds } from '../utils/soundEffects';

export default function StudentProfile() {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState(1);
  const [availability, setAvailability] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Phone Update with OTP State
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    donorService.getProfile()
      .then(res => {
        if (res.success && res.profile) {
          setProfile(res.profile);
          setName(res.profile.name);
          setDepartment(res.profile.department);
          setYear(res.profile.year);
          setAvailability(Boolean(res.profile.availability));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await donorService.updateProfile({ name, department, year, availability });
      updateUserProfile({ name, department, year, availability });
      sounds.playSuccess();
      setToast({ message: 'Profile details updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendNewPhoneOtp = async () => {
    const normalized = normalizePhoneNumber(newPhone);
    if (!normalized || normalized.length < 10) {
      setToast({ message: 'Please enter a valid mobile number with country code.', type: 'error' });
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authService.sendOtp({ phone: normalized, purpose: 'VERIFY' });
      if (res.success) {
        sounds.playOtpArrival();
        setOtpSent(true);
        setToast({ message: `Verification code dispatched to ${normalized}`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to dispatch OTP.', type: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyNewPhone = async () => {
    if (otpCode.length < 6) {
      setToast({ message: 'Please enter the complete 6-digit OTP code.', type: 'error' });
      return;
    }
    setOtpLoading(true);
    try {
      const normalized = normalizePhoneNumber(newPhone);
      const res = await authService.verifyOtp({ phone: normalized, otpCode, purpose: 'VERIFY' });
      if (res.success) {
        sounds.playSuccess();
        setProfile(prev => ({ ...prev, phone: normalized }));
        updateUserProfile({ phone: normalized });
        setEditingPhone(false);
        setOtpSent(false);
        setOtpCode('');
        setNewPhone('');
        setToast({ message: 'Mobile number updated and verified!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message || 'Verification failed. Please check the code.', type: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RotateCw className="w-4 h-4 animate-spin text-rose-500" />
        <span>Loading donor profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="glass-card p-6 sm:p-9 shadow-2xl border border-white/10 space-y-6 relative overflow-hidden">
        
        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/10 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center font-heading font-black text-2xl text-white shadow-lg shadow-rose-950/40">
            {profile?.blood_group || 'O+'}
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-white tracking-tight">{profile?.name}</h2>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${availability ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              Verified Campus Donor • {profile?.blood_group} Group • {availability ? 'Active Donor' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* Verification Credentials Card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 space-y-2 relative z-10">
          <div className="flex items-center gap-2 font-semibold text-rose-300">
            <Shield className="w-4 h-4 text-rose-400" />
            <span>Campus Registry Credentials</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-slate-400 block">Student Roll / ID:</span>
              <strong className="text-white font-mono">{profile?.student_id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Registered Phone:</span>
              <strong className="text-rose-300 font-mono">{profile?.phone}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 pt-1 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department / Faculty</label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Year</label>
              <select
                value={year}
                onChange={e => setYear(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 font-semibold"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
                <option value={5}>Postgraduate / PhD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-slate-400 text-xs cursor-not-allowed font-mono"
            />
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/10">
            <div>
              <span className="text-xs font-semibold text-white block">Emergency Availability Status</span>
              <span className="text-[11px] text-slate-400">Receive real-time alerts when compatible blood is needed</span>
            </div>
            <button
              type="button"
              onClick={() => setAvailability(!availability)}
              className={`p-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${availability ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              {availability ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-500" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3 text-xs font-semibold shadow-lg shadow-rose-600/20 mt-4"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                Saving Changes...
              </span>
            ) : (
              'Save Profile Changes'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { donorService } from '../services/donorService';
import { User, BookOpen, Heart, Shield, Smartphone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import Toast from '../components/Toast';

export default function StudentProfile() {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    donorService.getProfile()
      .then(res => {
        if (res.success && res.profile) {
          setProfile(res.profile);
          setName(res.profile.name);
          setDepartment(res.profile.department);
          setYear(res.profile.year);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await donorService.updateProfile({ name, department, year });
      updateUserProfile({ name, department, year });
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="glass-card p-8 shadow-2xl border border-white/10 space-y-6">
        
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center font-heading font-black text-2xl text-white shadow-xl shadow-rose-950/40">
            {profile?.blood_group || 'O+'}
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-white">{profile?.name}</h2>
            <span className="text-xs text-slate-400">Student Donor • Verified Profile</span>
          </div>
        </div>

        {/* Read-only Verified Security Notice */}
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            Student ID (<strong>{profile?.student_id}</strong>), Verified Phone (<strong>{profile?.phone}</strong>), and Blood Group are verified for safety and cannot be edited casually without administrator confirmation.
          </span>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Year of Study</label>
              <select
                value={year}
                onChange={e => setYear(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-2.5 text-xs font-bold mt-4"
          >
            {saving ? 'Saving Updates...' : 'Save Profile Changes'}
          </button>
        </form>

      </div>
    </div>
  );
}

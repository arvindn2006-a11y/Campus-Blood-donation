import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bloodRequestService } from '../services/bloodRequestService';
import { getCompatibleDonorsForRecipient, COMPATIBILITY_LEGAL_DISCLAIMER } from '../utils/bloodCompatibility';
import { Heart, Hospital, AlertOctagon, Send, Info } from 'lucide-react';
import Toast from '../components/Toast';

export default function CreateBloodRequest() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    component: 'Packed Red Blood Cells',
    unitsRequired: 1,
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    requiredDate: new Date().toISOString().split('T')[0],
    requiredTime: '12:00',
    urgency: 'EMERGENCY',
    additionalInfo: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);

  const compatibleDonorsList = getCompatibleDonorsForRecipient(formData.bloodGroup);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await bloodRequestService.createRequest(formData);
      if (res.success) {
        setToast({ message: res.message, type: 'success' });
        setTimeout(() => {
          navigate(`/requests/${res.request.id}`);
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create blood request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="glass-card p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl text-white">Broadcast Emergency Blood Request</h1>
            <p className="text-xs text-slate-400 mt-0.5">Automated donor matching, real-time WebSocket alerts, and transactional SMS</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Compatibility Matching Preview Pill */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Smart ABO & Rh Matching Aid:</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-xs">
              Recipient: {formData.bloodGroup}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Matching engine will notify donors with blood groups:{' '}
            <strong className="text-rose-400">{compatibleDonorsList.join(', ')}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Blood Group *</label>
              <select
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Units Required *</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.unitsRequired}
                onChange={e => setFormData({ ...formData, unitsRequired: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Urgency Level *</label>
              <select
                value={formData.urgency}
                onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
              >
                <option value="EMERGENCY">🚨 EMERGENCY (Immediate)</option>
                <option value="URGENT">⚠️ URGENT (Within 12h)</option>
                <option value="NORMAL">ℹ️ NORMAL (Planned)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Component Type</label>
            <input
              type="text"
              placeholder="e.g. Packed Red Blood Cells / Platelets"
              value={formData.component}
              onChange={e => setFormData({ ...formData, component: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hospital / Medical Center Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. University Teaching Hospital (ICU Wing)"
              value={formData.hospitalName}
              onChange={e => setFormData({ ...formData, hospitalName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hospital Address / Floor / Room *</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical Block 4, 2nd Floor Emergency"
              value={formData.hospitalAddress}
              onChange={e => setFormData({ ...formData, hospitalAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91-9876543210"
                value={formData.hospitalPhone}
                onChange={e => setFormData({ ...formData, hospitalPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Required Date *</label>
              <input
                type="date"
                required
                value={formData.requiredDate}
                onChange={e => setFormData({ ...formData, requiredDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Required Time</label>
              <input
                type="time"
                value={formData.requiredTime}
                onChange={e => setFormData({ ...formData, requiredTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Additional Clinical Information</label>
            <textarea
              rows={2}
              placeholder="e.g. Urgent trauma surgery requirement..."
              value={formData.additionalInfo}
              onChange={e => setFormData({ ...formData, additionalInfo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{COMPATIBILITY_LEGAL_DISCLAIMER}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-xs font-bold mt-4"
          >
            {loading ? 'Finding Matching Donors & Broadcasting...' : 'Broadcast Emergency Blood Request'}
          </button>
        </form>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bloodRequestService } from '../services/bloodRequestService';
import { getCompatibleDonorsForRecipient, COMPATIBILITY_LEGAL_DISCLAIMER } from '../utils/bloodCompatibility';
import { Heart, Hospital, AlertOctagon, Send, Info, Sparkles, Building2, MapPin, Phone, RotateCw } from 'lucide-react';
import Toast from '../components/Toast';
import { sounds } from '../utils/soundEffects';

export default function CreateBloodRequest() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    component: 'Packed Red Blood Cells',
    unitsRequired: 1,
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '+91-9876500001',
    requiredDate: new Date().toISOString().split('T')[0],
    requiredTime: '16:00',
    urgency: 'EMERGENCY',
    additionalInfo: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);

  const compatibleDonorsList = getCompatibleDonorsForRecipient(formData.bloodGroup);

  const hospitalPresets = [
    {
      name: 'University Teaching Hospital',
      address: 'Medical Campus, 3rd Floor ICU',
      phone: '+91-9876500001'
    },
    {
      name: 'Campus Student Health Center',
      address: 'Central Campus Block B, Room 102',
      phone: '+91-9876500002'
    },
    {
      name: 'City Trauma & Emergency Center',
      address: 'South Avenue, Emergency Care Wing',
      phone: '+91-9876500003'
    }
  ];

  const applyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      hospitalName: preset.name,
      hospitalAddress: preset.address,
      hospitalPhone: preset.phone
    }));
    setToast({ message: `Applied location preset: ${preset.name}`, type: 'info' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await bloodRequestService.createRequest(formData);
      if (res.success) {
        sounds.playEmergencyAlert();
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

      <div className="glass-card p-6 sm:p-9 shadow-2xl border border-rose-500/20 space-y-6 relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-6 border-b border-white/10 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-md">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl text-white">Broadcast Emergency Blood Request</h1>
            <p className="text-xs text-slate-400 mt-0.5">Automated donor matching, real-time WebSocket alerts, and transactional SMS</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Location Presets Quick Bar */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 relative z-10">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            ⚡ Quick Hospital / Campus Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {hospitalPresets.map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-600/20 hover:border-rose-500/40 border border-white/10 text-xs text-slate-200 transition-all text-left flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{preset.name.split(' ')[0]} {preset.name.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Compatibility Matching Preview Pill */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 to-purple-950/20 border border-rose-500/20 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Smart ABO & Rh Matching Aid:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs">
              Recipient: {formData.bloodGroup}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Matching engine will immediately notify student donors with blood groups:{' '}
            <strong className="text-rose-300 font-mono font-bold">{compatibleDonorsList.join(', ')}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Blood Group *</label>
              <select
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#172033] border border-white/10 text-white text-xs font-black focus:outline-none focus:border-rose-500"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Units Required *</label>
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
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Urgency Level *</label>
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
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Component Type</label>
            <input
              type="text"
              placeholder="e.g. Packed Red Blood Cells / Platelets"
              value={formData.component}
              onChange={e => setFormData({ ...formData, component: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Hospital / Medical Center Name *</label>
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
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Hospital Address / Floor / Room *</label>
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
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Emergency Contact Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91-9876543210"
                value={formData.hospitalPhone}
                onChange={e => setFormData({ ...formData, hospitalPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Required Date *</label>
              <input
                type="date"
                required
                value={formData.requiredDate}
                onChange={e => setFormData({ ...formData, requiredDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Required Time</label>
              <input
                type="time"
                value={formData.requiredTime}
                onChange={e => setFormData({ ...formData, requiredTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Additional Clinical Information</label>
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
            className="btn-primary w-full py-3.5 text-xs font-bold mt-4 shadow-xl shadow-rose-600/30"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                Matching Donors & Broadcasting Alerts...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Broadcast Emergency Blood Request
              </span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

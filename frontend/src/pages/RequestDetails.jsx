import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bloodRequestService } from '../services/bloodRequestService';
import { donorService } from '../services/donorService';
import { donationService } from '../services/donationService';
import { useAuth } from '../context/AuthContext';
import { COMPATIBILITY_LEGAL_DISCLAIMER } from '../utils/bloodCompatibility';
import { Hospital, MapPin, Calendar, Clock, Phone, AlertTriangle, Users, CheckCircle, XCircle, Info } from 'lucide-react';
import Toast from '../components/Toast';

export default function RequestDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      const res = await bloodRequestService.getRequestById(id);
      if (res.success) {
        setRequest(res.request);
        setMatches(res.matches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Find match record corresponding to logged-in student
  const myMatch = matches.find(m => m.student_id === user?.studentId || m.donor_id === user?.studentId);

  const handleDonorResponse = async (matchId, responseStatus) => {
    setResponding(true);
    try {
      await donorService.respondToMatch(matchId, responseStatus);
      setToast({
        message: `Response updated: ${responseStatus === 'AVAILABLE' ? 'Accepted' : 'Declined'}`,
        type: 'success'
      });
      fetchRequestDetails();
    } catch (err) {
      setToast({ message: err.message || 'Failed to record response', type: 'error' });
    } finally {
      setResponding(false);
    }
  };

  const handleConfirmDonation = async (donorId) => {
    try {
      await donationService.recordDonation({
        donorId,
        bloodRequestId: id,
        donationDate: new Date().toISOString().split('T')[0],
        units: 1.0,
        hospitalName: request.hospital_name
      });
      setToast({ message: 'Donation verified and recorded successfully!', type: 'success' });
      fetchRequestDetails();
    } catch (err) {
      setToast({ message: err.message || 'Failed to verify donation', type: 'error' });
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading request details...</div>;
  }

  if (!request) {
    return <div className="p-12 text-center text-slate-400 text-xs">Request not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Main Request Details Panel */}
      <div className="glass-card p-6 sm:p-8 space-y-6 border-l-4 border-l-rose-500">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center font-heading font-black text-3xl text-white shadow-xl shadow-rose-950/40">
              {request.blood_group}
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">Blood Requirement</span>
              <h1 className="font-heading font-extrabold text-2xl text-white">
                {request.units_required} Unit(s) {request.component}
              </h1>
              <span className="text-xs text-rose-400 font-bold block mt-0.5">
                Urgency: {request.urgency}
              </span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 self-start">
            Status: <strong className="text-emerald-400">{request.status}</strong>
          </div>
        </div>

        {/* Hospital & Timing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs text-slate-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hospital className="w-4 h-4 text-rose-400" />
              <strong className="text-slate-200">{request.hospital_name}</strong>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{request.hospital_address}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{request.hospital_phone}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>Required Date: <strong>{new Date(request.required_date).toLocaleDateString()}</strong></span>
            </div>
            {request.required_time && (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Required Time: {request.required_time}</span>
              </div>
            )}
            {request.additional_info && (
              <p className="text-slate-400 italic text-[11px] pt-1">
                "{request.additional_info}"
              </p>
            )}
          </div>
        </div>

        {/* Student Action Bar (Accept/Decline if matched) */}
        {user?.role === 'STUDENT' && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-white text-sm">Are you available to donate for this patient?</h4>
              <p className="text-[11px] text-slate-400">Responding will immediately notify the hospital & coordinator.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDonorResponse(myMatch ? myMatch.match_id : 1, 'AVAILABLE')}
                disabled={responding}
                className="btn-primary text-xs py-2 px-4"
              >
                <CheckCircle className="w-4 h-4" />
                <span>I Can Donate (Accept)</span>
              </button>
              <button
                onClick={() => handleDonorResponse(myMatch ? myMatch.match_id : 1, 'NOT_AVAILABLE')}
                disabled={responding}
                className="btn-secondary text-xs py-2 px-4"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        )}

        {/* Legal Medical Disclaimer */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{COMPATIBILITY_LEGAL_DISCLAIMER}</span>
        </div>

      </div>

      {/* Matched Donors Live Tracker (Visible to Admin & Authorized Coordinators) */}
      {user?.role === 'ADMIN' && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-white">
              Matched Campus Donors ({matches.length})
            </h3>
            <span className="text-xs text-slate-400">Real-time status monitor</span>
          </div>

          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map(m => (
                <div key={m.match_id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-200 text-sm">{m.donor_name}</strong>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                        {m.blood_group} ({m.match_type})
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {m.department} • Roll ID: {m.student_id} {m.donor_phone !== 'PROTECTED' && `• 📞 ${m.donor_phone}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${m.response === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : m.response === 'NOT_AVAILABLE' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'}`}>
                      {m.response}
                    </span>

                    {m.response === 'AVAILABLE' && !m.confirmed && (
                      <button
                        onClick={() => handleConfirmDonation(m.donor_id)}
                        className="btn-primary text-xs py-1 px-2.5"
                      >
                        Verify Donation
                      </button>
                    )}

                    {m.confirmed && (
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No matching donors notified for this request.</p>
          )}
        </div>
      )}

    </div>
  );
}

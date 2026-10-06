import React, { useEffect, useState } from 'react';
import { donationService } from '../services/donationService';
import { ShieldCheck, Calendar, Hospital, Droplet } from 'lucide-react';

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    donationService.getMyDonations()
      .then(res => {
        if (res.success) setDonations(res.donations || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="font-heading font-black text-3xl text-white">My Donation History</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Audit log of your verified blood donations supporting campus and local hospitals</p>
      </div>

      {loading ? (
        <div className="glass-card p-8 animate-pulse h-48" />
      ) : donations.length > 0 ? (
        <div className="space-y-4">
          {donations.map(don => (
            <div key={don.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-emerald-500">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-white">{don.hospital_name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(don.donation_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    {don.units} Unit(s) {don.component || 'Blood'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500">
                <span>Verified by Campus Health Coordinator</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-white">No Donation Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you respond to a blood request and complete a verified donation, the campus health administrator will record and verify your contribution here.
          </p>
        </div>
      )}
    </div>
  );
}

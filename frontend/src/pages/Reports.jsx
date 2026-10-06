import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, Users, Download, PieChart } from 'lucide-react';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports')
      .then(res => {
        if (res.data.success) {
          setReportData(res.data.reports);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const monthlyTrends = reportData?.monthlyTrends || [];
  const deptStats = reportData?.deptStats || [];
  const responseStats = reportData?.responseStats || [];

  const handleExportCsv = () => {
    let csv = "Department,Donor Count,Verified Donations\n";
    deptStats.forEach(d => {
      csv += `"${d.department}",${d.donor_count},${d.verified_donations}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campus_bloodconnect_analytics.csv';
    a.click();
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl text-white">Campus Blood Analytics & Reports</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Real database aggregation metrics for campus administration review</p>
        </div>
        <button
          onClick={handleExportCsv}
          className="btn-primary text-xs py-2.5 px-4 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Grid: Charts & Department Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Donation Trends */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" />
              <span>Monthly Verified Donations</span>
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {monthlyTrends.length > 0 ? (
              monthlyTrends.map(m => (
                <div key={m.month} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{m.month}</span>
                    <strong className="text-rose-400">{m.donation_count} donations ({m.units} Units)</strong>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.donation_count / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No historical donation data available yet.</p>
            )}
          </div>
        </div>

        {/* Department Participation Breakdown */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Department-wise Participation</span>
          </h3>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pt-2">
            {deptStats.length > 0 ? (
              deptStats.map(d => (
                <div key={d.department} className="p-3 rounded-xl bg-white/5 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-200 block">{d.department}</strong>
                    <span className="text-[10px] text-slate-400">{d.verified_donations} verified donation(s)</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-bold text-xs">
                    {d.donor_count} Donors
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No department statistics yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

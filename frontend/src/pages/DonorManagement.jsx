import React, { useEffect, useState } from 'react';
import { donorService } from '../services/donorService';
import DonorCard from '../components/DonorCard';
import { Search, Users, Filter } from 'lucide-react';

export default function DonorManagement() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');

  useEffect(() => {
    fetchDonors();
  }, [bloodGroupFilter, availFilter]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await donorService.getAllDonors({
        bloodGroup: bloodGroupFilter || undefined,
        availability: availFilter || undefined,
        search: search || undefined
      });
      if (res.success) {
        setDonors(res.donors || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDonors();
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="font-heading font-black text-3xl text-white">Campus Donor Directory</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Search, filter, and manage verified student donors across campus departments</p>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name or roll ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={bloodGroupFilter}
            onChange={e => setBloodGroupFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#172033] border border-white/10 text-white text-xs focus:outline-none"
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={availFilter}
            onChange={e => setAvailFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#172033] border border-white/10 text-white text-xs focus:outline-none"
          >
            <option value="">All Availability</option>
            <option value="true">Available Donors Only</option>
            <option value="false">Unavailable Donors</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass-card p-6 h-20 animate-pulse" />)}
        </div>
      ) : donors.length > 0 ? (
        <div className="space-y-3">
          {donors.map(donor => (
            <DonorCard key={donor.student_id} donor={donor} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-heading font-bold text-white text-base">No Donors Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting search query or filters.</p>
        </div>
      )}
    </div>
  );
}

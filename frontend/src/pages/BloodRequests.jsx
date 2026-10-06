import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bloodRequestService } from '../services/bloodRequestService';
import BloodRequestCard from '../components/BloodRequestCard';
import { Filter, Search, PlusCircle, AlertOctagon } from 'lucide-react';

export default function BloodRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [bloodGroupFilter, urgencyFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await bloodRequestService.getAllRequests({
        bloodGroup: bloodGroupFilter || undefined,
        urgency: urgencyFilter || undefined
      });
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      req.hospital_name?.toLowerCase().includes(term) ||
      req.blood_group?.toLowerCase().includes(term) ||
      req.component?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl text-white">Emergency Blood Requests</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Browse open campus hospital requirements or broadcast a new requirement</p>
        </div>
        <Link to="/create-request" className="btn-primary text-xs py-2.5 px-4 self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          <span>New Blood Request</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search hospital or blood group..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
          />
        </div>

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
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#172033] border border-white/10 text-white text-xs focus:outline-none"
          >
            <option value="">All Urgency Levels</option>
            <option value="EMERGENCY">Emergency (Critical)</option>
            <option value="URGENT">Urgent</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="glass-card p-6 h-52 animate-pulse" />)}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(req => (
            <BloodRequestCard key={req.id} request={req} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400">
          <AlertOctagon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-white text-base">No Requests Found</h3>
          <p className="text-xs text-slate-400 mt-1">No blood requests match your selected filters.</p>
        </div>
      )}

    </div>
  );
}

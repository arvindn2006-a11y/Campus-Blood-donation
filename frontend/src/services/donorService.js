import api from './api';

export const donorService = {
  getAllDonors: async (filters = {}) => {
    const res = await api.get('/donors', { params: filters });
    return res.data;
  },
  getMyMatches: async () => {
    const res = await api.get('/donors/my-matches');
    return res.data;
  },
  respondToMatch: async (matchId, response) => {
    const res = await api.post(`/donors/matches/${matchId}/respond`, { response });
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/students/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/students/profile', data);
    return res.data;
  },
  toggleAvailability: async (availability) => {
    const res = await api.put('/students/availability', { availability });
    return res.data;
  }
};


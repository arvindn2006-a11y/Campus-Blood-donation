import api from './api';

export const donationService = {
  getMyDonations: async () => {
    const res = await api.get('/donations/my');
    return res.data;
  },
  recordDonation: async (data) => {
    const res = await api.post('/donations', data);
    return res.data;
  }
};

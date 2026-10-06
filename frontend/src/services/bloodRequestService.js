import api from './api';

export const bloodRequestService = {
  getAllRequests: async (filters = {}) => {
    const res = await api.get('/blood-requests', { params: filters });
    return res.data;
  },
  createRequest: async (data) => {
    const res = await api.post('/blood-requests', data);
    return res.data;
  },
  getRequestById: async (id) => {
    const res = await api.get(`/blood-requests/${id}`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/blood-requests/${id}/status`, { status });
    return res.data;
  }
};

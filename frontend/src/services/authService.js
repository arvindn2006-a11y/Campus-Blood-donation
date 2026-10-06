import api from './api';

export const authService = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  adminLogin: async (credentials) => {
    const res = await api.post('/auth/admin/login', credentials);
    return res.data;
  }
};

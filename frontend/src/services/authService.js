import api from './api';

export const authService = {
  // Mobile & Email OTP Generator
  sendOtp: async ({ phone, email, name, purpose = 'REGISTER' }) => {
    const res = await api.post('/auth/send-otp', { phone, email, name, purpose });
    return res.data;
  },

  // Verify Real-Time OTP Code
  verifyOtp: async ({ phone, otpCode, purpose = 'REGISTER' }) => {
    const res = await api.post('/auth/verify-otp', { phone, otpCode, purpose });
    return res.data;
  },

  // Direct Phone Login with Verified OTP
  phoneLogin: async ({ phone, otpCode, verificationToken }) => {
    const res = await api.post('/auth/phone-login', { phone, otpCode, verificationToken });
    return res.data;
  },

  // Complete Student Registration
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  // Email / Password Login
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  // Admin Portal Secure Login
  adminLogin: async (credentials) => {
    const res = await api.post('/auth/admin/login', credentials);
    return res.data;
  },

  // Get SMS Dispatch Logs (Admin)
  getSmsLogs: async () => {
    const res = await api.get('/auth/sms-logs');
    return res.data;
  }
};


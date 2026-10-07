import axios from 'axios';

// Smart API Base URL resolver
const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_BASE_URL;
  if (!rawUrl || rawUrl.trim() === '') {
    return '/api';
  }
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (trimmed === '/api' || trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';

    if (status === 401) {
      // Token expired or invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session_expired=1';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

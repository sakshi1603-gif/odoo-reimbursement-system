import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Auto-attach JWT from localStorage on every request
api.interceptors.request.use(config => {
  const stored = localStorage.getItem('auth');
  if (stored) {
    const { token } = JSON.parse(stored);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
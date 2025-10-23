import axios from 'axios';
import { clearSession } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearSession();
      // Best-effort redirect to login preserving intended path
      const current = window.location.pathname + window.location.search;
      const redirect = `/login?next=${encodeURIComponent(current)}`;
      if (window.location.pathname !== '/login') {
        window.location.replace(redirect);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

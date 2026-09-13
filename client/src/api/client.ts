import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ak8.hopto.org:25565/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alchemist_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired or invalidated, clear storage and redirect
      localStorage.removeItem('alchemist_token');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

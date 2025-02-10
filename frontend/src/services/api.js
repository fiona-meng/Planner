import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
      'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
      config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
      localStorage.removeItem('token');
  },
};

export { authAPI };
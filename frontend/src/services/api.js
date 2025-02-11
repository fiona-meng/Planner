import axios from './axios';

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

api.interceptors.response.use(
    response => response,
    error => {
        // Handle error globally
        console.error('API error:', error);
        // Optionally, show a notification or redirect
        return Promise.reject(error);
    }
);

const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
      localStorage.removeItem('token');
  },
};

const eventAPI = {
  createEvent: (eventData) => api.post('/events', eventData),
  getEvents: () => api.get('/events'),
  updateEvent: (eventId, eventData) => api.put(`/events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`)
};

const todoAPI = {
  createTodo: (todoData) => api.post('/todos', todoData),
  getTodos: () => api.get('/todos'),
  updateTodo: (todoId, todoData) => api.put(`/todos/${todoId}`, todoData),
  deleteTodo: (todoId) => api.delete(`/todos/${todoId}`),
  toggleStatus: (todoId) => api.put(`/todos/${todoId}/toggle`),
  getTodosByStatus: (status) => api.get(`/todos/status/${status}`),
  getTodosByDate: (date) => api.get(`/todos/date/${date}`),
  getTodosByDateRange: (startDate, endDate) => api.get(`/todos/date-range?startDate=${startDate}&endDate=${endDate}`)
};


export { authAPI, eventAPI, todoAPI };
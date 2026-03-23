import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification')
};

export const benchmarks = {
  getAll: (params) => api.get('/benchmarks', { params }),
  getById: (id) => api.get(`/benchmarks/${id}`),
  getByUser: (userId, params) => api.get(`/benchmarks/user/${userId}`, { params }),
  getCategories: () => api.get('/benchmarks/stats/categories'),
  getTools: () => api.get('/benchmarks/stats/tools'),
  submit: (data) => api.post('/benchmarks', data),
  flag: (id) => api.post(`/benchmarks/${id}/flag`)
};

export const comments = {
  getByBenchmark: (benchmarkId) => api.get(`/comments/${benchmarkId}`),
  add: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`)
};

export const admin = {
  getFlags: () => api.get('/admin/flags'),
  getUsers: () => api.get('/admin/users'),
  removeBenchmark: (id) => api.post(`/admin/benchmark/${id}/remove`),
  unflagBenchmark: (id) => api.post(`/admin/benchmark/${id}/unflag`),
  banUser: (id) => api.post(`/admin/user/${id}/ban`),
  unbanUser: (id) => api.post(`/admin/user/${id}/unban`)
};

export const votes = {
  cast: (reportId, voteType) => api.post('/votes', { reportId, voteType }),
  remove: (reportId) => api.delete(`/votes/${reportId}`),
  getByReport: (reportId) => api.get(`/votes/report/${reportId}`),
  getMyVote: (reportId) => api.get(`/votes/my/${reportId}`),
};

export const hardware = {
  getAll: (params) => api.get('/hardware', { params }),
  getById: (id) => api.get(`/hardware/${id}`),
  getTrending: (limit = 10) => api.get('/hardware/trending', { params: { limit } }),
  resolve: (text) => api.post('/hardware/resolve', { text }),
  getRating: (id) => api.get(`/ratings/hardware/${id}`),
  getRatingHistory: (id) => api.get(`/ratings/hardware/${id}/history`),
  recalculateRating: (id) => api.post(`/ratings/recalculate/${id}`),
};

export const feed = {
  getAll: (params) => api.get('/feed', { params }),
  getMilestones: (params) => api.get('/feed/milestones', { params }),
  getTrending: (params) => api.get('/feed/trending', { params }),
};

export const profiles = {
  getByUsername: (username) => api.get(`/profiles/${username}`),
  getBadges: (username) => api.get(`/profiles/${username}/badges`),
  getHardware: (username) => api.get(`/profiles/${username}/hardware`),
  getActivity: (username, params) => api.get(`/profiles/${username}/activity`, { params }),
};

export const collections = {
  getAll: (params) => api.get('/collections', { params }),
  getMy: () => api.get('/collections/my'),
  getById: (id) => api.get(`/collections/${id}`),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  delete: (id) => api.delete(`/collections/${id}`),
  getItems: (id) => api.get(`/collections/${id}/items`),
  addItem: (id, data) => api.post(`/collections/${id}/items`, data),
  removeItem: (id, itemId) => api.delete(`/collections/${id}/items/${itemId}`),
  vote: (id) => api.post(`/collections/${id}/vote`),
  unvote: (id) => api.delete(`/collections/${id}/vote`),
};

export const tags = {
  getAll: (params) => api.get('/tags', { params }),
  search: (q) => api.get('/tags/search', { params: { q } }),
  getByName: (name) => api.get(`/tags/${name}`),
};

export default api;

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cratey_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cratey_access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('cratey_access_token');
    return apiClient.post('/auth/logout');
  },
  me: () => apiClient.get('/auth/me'),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

// User API
export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.patch('/users/profile', data),
  changePassword: (data) => apiClient.post('/users/change-password', data),
  getSettings: () => apiClient.get('/users/settings'),
  updateSettings: (data) => apiClient.patch('/users/settings', data),
};

// Artist API
export const artistAPI = {
  list: (params) => apiClient.get('/artists', { params }),
  getBySlug: (slug) => apiClient.get(`/artists/slug/${slug}`),
  get: (id) => apiClient.get(`/artists/${id}`),
  signup: (data) => apiClient.post('/artists/signup', data),
  updateProfile: (data) => apiClient.patch('/artists/profile', data),
  getDashboardStats: () => apiClient.get('/artists/dashboard/stats'),
};

// Product API
export const productAPI = {
  list: (params) => apiClient.get('/products', { params }),
  get: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.patch(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
  getFeatured: () => apiClient.get('/products/featured/list'),
  getNewReleases: () => apiClient.get('/products/new/releases'),
};

// Order API
export const orderAPI = {
  list: (params) => apiClient.get('/orders', { params }),
  get: (id) => apiClient.get(`/orders/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
  getStats: () => apiClient.get('/orders/stats/overview'),
};

// Library API
export const libraryAPI = {
  list: (email) => apiClient.get('/library', { params: { email } }),
  get: (id) => apiClient.get(`/library/${id}`),
  verify: (data) => apiClient.post('/library/verify', data),
  download: (id) => apiClient.post(`/library/${id}/download`),
  access: (id, token) => apiClient.get(`/library/${id}/access`, { params: { token } }),
};

// Stripe API
export const stripeAPI = {
  createCheckoutSession: (data) => apiClient.post('/stripe/create-checkout-session', data),
  connect: () => apiClient.post('/stripe/connect'),
};

// Audio API
export const audioAPI = {
  getSignedUrl: (data) => apiClient.post('/audio/signed-url', data),
  generatePreview: (data) => apiClient.post('/audio/generate-preview', data),
  incrementDownload: (data) => apiClient.post('/audio/increment-download', data),
};

// Email API
export const emailAPI = {
  sendPurchase: (data) => apiClient.post('/email/purchase', data),
  sendLibraryAccess: (data) => apiClient.post('/email/library-access', data),
  send: (data) => apiClient.post('/email/send', data),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getProduct: (id) => apiClient.get(`/analytics/product/${id}`),
  getPlatform: () => apiClient.get('/analytics/platform'),
};

// Search API
export const searchAPI = {
  search: (q, params) => apiClient.get('/search', { params: { q, ...params } }),
  suggestions: (q) => apiClient.get('/search/suggestions', { params: { q } }),
  popular: () => apiClient.get('/search/popular'),
};

// Cart API
export const cartAPI = {
  get: () => apiClient.get('/cart'),
  add: (data) => apiClient.post('/cart/add', data),
  update: (id, quantity) => apiClient.patch(`/cart/item/${id}`, { quantity }),
  remove: (id) => apiClient.delete(`/cart/item/${id}`),
  clear: () => apiClient.delete('/cart/clear'),
};

// Wishlist API
export const wishlistAPI = {
  list: () => apiClient.get('/wishlist'),
  add: (data) => apiClient.post('/wishlist/add', data),
  remove: (productId) => apiClient.delete(`/wishlist/${productId}`),
  check: (productId) => apiClient.get(`/wishlist/check/${productId}`),
};

export default apiClient;

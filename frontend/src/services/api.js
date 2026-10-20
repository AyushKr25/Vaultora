import axios from 'axios';

// In dev, '/api' is proxied to localhost:5000 by Vite.
// In production (e.g. Netlify), set VITE_API_URL to your backend's public URL
// (e.g. https://your-backend.onrender.com).
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    });

                    const { accessToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data),
};

export const accountsAPI = {
    getAll: () => api.get('/accounts'),
    get: (id) => api.get(`/accounts/${id}`),
    create: (data) => api.post('/accounts', data),
    update: (id, data) => api.put(`/accounts/${id}`, data),
    getBalance: (id) => api.get(`/accounts/${id}/balance`),
    getSummary: () => api.get('/accounts/summary'),
};

export const transactionsAPI = {
    deposit: (data) => api.post('/transactions/deposit', data),
    withdraw: (data) => api.post('/transactions/withdraw', data),
    transfer: (data) => api.post('/transactions/transfer', data),
    getHistory: (params) => api.get('/transactions/history', { params }),
    getStatement: (params) => api.get('/transactions/statement', {
        params,
        responseType: 'blob'
    }),
    getAnalytics: (params) => api.get('/transactions/analytics', { params }),
};

export const usersAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getPreferences: () => api.get('/users/preferences'),
    updatePreferences: (data) => api.put('/users/preferences', data),
};

export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getAccounts: (params) => api.get('/admin/accounts', { params }),
    freezeAccount: (id, data) => api.post(`/admin/accounts/${id}/freeze`, data),
    unfreezeAccount: (id) => api.post(`/admin/accounts/${id}/unfreeze`),
    deleteAccount: (id) => api.delete(`/admin/accounts/${id}`),
    getUsers: (params) => api.get('/admin/users', { params }),
    deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate`),
    activateUser: (id) => api.post(`/admin/users/${id}/activate`),
    getLogs: (params) => api.get('/admin/logs', { params }),
    getAnalytics: (params) => api.get('/admin/analytics', { params }),
};

export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
    clearAll: () => api.delete('/notifications/clear'),
};

export default api;


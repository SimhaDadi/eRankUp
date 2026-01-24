import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 300000, // 5 minutes for AI parsing tasks
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login if 401 Unauthorized
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                // Optional: window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

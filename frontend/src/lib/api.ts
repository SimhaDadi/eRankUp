import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
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
// Flag to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
            const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
            const user = userStr ? JSON.parse(userStr) : null;

            if (refreshToken && user?.id) {
                try {
                    // Use standard /api proxy which rewrites to backend
                    const response = await axios.post('/api/auth/refresh', {
                        userId: user.id,
                        refreshToken: refreshToken
                    });

                    if (response.status === 200 || response.status === 201) {
                        const { access_token, refresh_token: newRefreshToken } = response.data;

                        localStorage.setItem('token', access_token);
                        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);

                        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
                        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;

                        processQueue(null, access_token);
                        isRefreshing = false;

                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    // Logout on fail
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('token');
                        localStorage.removeItem('refresh_token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, just logout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

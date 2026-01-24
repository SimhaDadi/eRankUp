import { create } from 'zustand';
import api from '../lib/api';
import { User, AuthState } from '../types/auth.types';

export const useAuthStore = create<AuthState>((set) => ({
    user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isLoading: false,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', credentials);
            const { access_token, user } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token: access_token, isLoading: false });
        } catch (error: any) {
            console.error("Login Error Full Object:", error);
            const status = error.response?.status;
            const msg = error.response?.data?.message || error.message || 'Unknown Error';
            const detailedError = `Login Failed (${status || 'Network'}): ${msg}`;

            set({
                error: detailedError,
                isLoading: false
            });
            throw error;
        }
    },

    signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/auth/signup', data);
            set({ isLoading: false });
        } catch (error: any) {
            set({
                error: error.response?.data?.message || 'Signup failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
    },

    setUser: (user) => set({ user }),
}));


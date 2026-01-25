'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';

export default function Signup() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const { signup, isLoading, error } = useAuthStore();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const { confirmPassword, ...dataToSend } = formData;
            await signup(dataToSend);
            router.push('/login');
        } catch (err) {
            // Error handled in store
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0fcf9] via-[#f7fdfc] to-white relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative z-10"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <span className="text-3xl font-black text-[#00bfa5] tracking-tighter">eRankUp</span>
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
                    <p className="text-slate-500 mt-1">Join thousands of students today</p>
                    {error && <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Full Name
                        </label>
                        <input
                            name="fullName"
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00bfa5]/20 focus:border-[#00bfa5] outline-none text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Email Address
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00bfa5]/20 focus:border-[#00bfa5] outline-none text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00bfa5]/20 focus:border-[#00bfa5] outline-none text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                            placeholder="Create a strong password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Confirm Password
                        </label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00bfa5]/20 focus:border-[#00bfa5] outline-none text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                            placeholder="Repeat password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg shadow-[#00bfa5]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4
              ${isLoading
                                ? 'bg-[#00bfa5]/70 cursor-not-allowed'
                                : 'bg-[#00bfa5] hover:bg-[#00a693]'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Account...
                            </span>
                        ) : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 flex items-center gap-4 text-slate-400">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">or sign up with</span>
                    <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="mt-4">
                    <button
                        onClick={() => window.location.href = 'http://localhost:3001/auth/google'}
                        className="w-full py-3 border border-slate-200 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-bold"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-slate-700 text-sm">Continue with Google</span>
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#00bfa5] hover:text-[#008f7a] font-bold transition-colors">
                        Sign in
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

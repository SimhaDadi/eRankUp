'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { isValidEmail } from '@/utils/validators';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const { login, isLoading, error } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidEmail(email)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        try {
            await login({ email, password });
            const user = useAuthStore.getState().user;
            if (user?.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            // Error is handled in store
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Ambient background effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl shadow-blue-900/5 relative z-10 border border-gray-100"
            >
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-6">
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 tracking-tighter">
                            eRankUp
                        </h1>
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                    <p className="text-slate-500 mt-2">Sign in to continue your preparation.</p>
                    {error && <p className="text-red-600 text-sm mt-4 bg-red-50 p-3 rounded-xl border border-red-100 font-medium">{error}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError('');
                            }}
                            className={`w-full px-5 py-4 bg-gray-50 border rounded-xl focus:ring-2 outline-none text-slate-900 placeholder-slate-400 transition-all font-medium ${emailError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                            placeholder="you@email.com"
                        />
                        {emailError && <p className="text-red-500 text-xs mt-1 font-medium ml-1">{emailError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 placeholder-slate-400 transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-slate-500 cursor-pointer font-medium">
                            <input type="checkbox" className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4" />
                            Remember me
                        </label>
                        <a href="mailto:support@erankup.com" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]
              ${isLoading
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-[#00bfa5] hover:opacity-90'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Signing in...
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 flex items-center gap-4 text-slate-400">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-xs font-bold uppercase tracking-wider">or continue with</span>
                    <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="mt-6">
                    <button
                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`}
                        className="w-full py-4 border-2 border-slate-100 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-bold group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="text-slate-700">Sign in with Google</span>
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-slate-500 font-medium">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                        Create account
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

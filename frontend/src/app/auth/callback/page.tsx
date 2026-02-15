'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useAuthStore();

    useEffect(() => {
        const dataStr = searchParams.get('data');
        if (dataStr) {
            try {
                const result = JSON.parse(decodeURIComponent(dataStr));
                const { access_token, user } = result;

                // Store in localStorage
                localStorage.setItem('token', access_token);
                localStorage.setItem('user', JSON.stringify(user));

                // Update Zustand store
                // Note: we need to manually update token state if authStore doesn't have a specific setToken
                // but usually setUser is enough if the store reads from localStorage on init
                // However, let's be safe and refresh the page or set state.
                window.location.href = user.role === 'admin' ? '/admin' : '/dashboard';
            } catch (error) {
                console.error('Failed to parse OAuth result', error);
                router.push('/login?error=OAuth failed');
            }
        } else {
            router.push('/login');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-slate-900">Completing Sign-in...</h2>
                <p className="text-slate-500 mt-2">Please wait while we set up your session.</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackHandler />
        </Suspense>
    );
}

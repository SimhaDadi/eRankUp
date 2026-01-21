'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import ChatSupport from '../../components/ChatSupport';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        // Prevent flashing content before redirect
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <Topbar />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
                <ChatSupport />
            </div>
        </div>
    );
}

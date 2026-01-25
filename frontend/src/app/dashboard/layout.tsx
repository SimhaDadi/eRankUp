'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const isTestMode = pathname?.startsWith('/dashboard/test/');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    if (isTestMode) {
        return (
            <div className="min-h-screen bg-white">
                <main className="h-screen overflow-hidden">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <Topbar />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
                <ChatSupport />
            </div>
        </div>
    );
}

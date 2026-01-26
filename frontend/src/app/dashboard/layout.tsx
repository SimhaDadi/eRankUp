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
    const [isMounted, setIsMounted] = useState(false);

    const isTestMode = pathname?.startsWith('/dashboard/test/');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router, isMounted]);

    if (!isMounted || isLoading) {
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
        <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-blue-100 selection:text-blue-900">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isSidebarCollapsed ? 'ml-[86px]' : 'ml-[280px]'}`}>
                <Topbar />
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
                <ChatSupport />
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import ChatSupport from '../../components/ChatSupport';
import PageTransition from '../../components/PageTransition';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import api from '@/lib/api';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading, setActivePass } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const isTestMode = pathname?.startsWith('/dashboard/test/') || pathname?.startsWith('/dashboard/assessment-start/');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router, isMounted]);

    // [NEW] Global fetch for Active Pass
    useEffect(() => {
        const fetchPassStatus = async () => {
            if (user && isMounted) {
                try {
                    const res = await api.get('/passes/current');
                    setActivePass(res.data);
                } catch (error) {
                    console.error("Failed to fetch global pass status", error);
                }
            }
        };

        fetchPassStatus();
    }, [user, isMounted, setActivePass]);

    if (!isMounted || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <div className="h-16 bg-white border-b border-slate-200 animate-pulse" />
                <div className="flex-1 p-6">
                    <DashboardSkeleton />
                </div>
            </div>
        );
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
        <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isSidebarCollapsed ? 'lg:ml-[86px]' : 'lg:ml-[280px]'} ml-0`}>
                <Suspense fallback={<div className="h-20 bg-white/80 border-b border-white/50" />}>
                    <Topbar onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
                </Suspense>
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto">
                        <PageTransition>
                            <Suspense fallback={<DashboardSkeleton />}>
                                {children}
                            </Suspense>
                        </PageTransition>
                    </div>
                </main>
                <ChatSupport />
            </div>
            <Toaster position="bottom-right" reverseOrder={false} />
        </div>
    );
}

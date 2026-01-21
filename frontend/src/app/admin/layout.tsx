'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
    Users,
    BookOpen,
    Settings,
    FileText,
    LayoutDashboard,
    Bell,
    AlertTriangle,
    Layers,
    Activity,
    Sparkles,
    TrendingUp,
    Tag,
    Calendar,
    Banknote,
    Search,
    Plus,
    LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

const adminNavSections = [
    {
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
        ]
    },
    {
        title: 'CONTENT MANAGEMENT',
        items: [
            { icon: BookOpen, label: 'Manage Exams', href: '/admin/exams' },
            { icon: Calendar, label: 'Live Exams', href: '/admin/live-exams' },
            { icon: Plus, label: 'Standard Question Bank', href: '/admin/question-bank' },
            { icon: Layers, label: 'Hierarchy & Subjects', href: '/admin/hierarchy' },
            { icon: FileText, label: 'Previous Year Papers', href: '/admin/pyp' },
        ]
    },
    {
        title: 'AI & ANALYTICS',
        items: [
            { icon: Sparkles, label: 'AI Explanations', href: '/admin/ai-explanations' },
            { icon: TrendingUp, label: 'Analytics Dashboard', href: '/admin/analytics' },
            { icon: Users, label: 'Student Monitoring', href: '/admin/students' },
            { icon: FileText, label: 'Content Management', href: '/admin/content' },
            { icon: Banknote, label: 'Finance & Payments', href: '/admin/finance' },
            { icon: AlertTriangle, label: 'Quality Control', href: '/admin/quality-control' },
        ]
    },
    {
        title: 'ADMINISTRATION',
        items: [
            { icon: Users, label: 'Users Data', href: '/admin/users' },
            { icon: Tag, label: 'Marketing', href: '/admin/marketing' },
            { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
            { icon: Settings, label: 'Settings', href: '/admin/settings' },
        ]
    }
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null; // or a 403 unauthorized view
    }

    return (
        <div className="min-h-screen bg-[#0c111d] text-slate-100 flex font-inter">
            <Sidebar customNavSections={adminNavSections} title="eRankUp Admin" />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="h-20 border-b border-slate-800/50 bg-[#0c111d]/50 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search Command..."
                            className="bg-transparent border-none outline-none text-sm w-64 text-slate-300 placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="relative p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0c111d]"></span>
                        </motion.button>

                        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-200">{user?.fullName || 'Admin User'}</div>
                                <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{user?.role || 'Administrator'}</div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
                                {user?.fullName?.charAt(0) || 'A'}
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all ml-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </motion.button>
                    </div>
                </header>

                <main className="flex-1 p-8 text-slate-100">
                    {children}
                </main>
            </div>
        </div>
    );
}

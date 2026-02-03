'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    LogOut,
    Zap,
    Newspaper
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
            { icon: BookOpen, label: 'Drafts & Staging', href: '/admin/exams' },
            { icon: BookOpen, label: 'Mock Tests', href: '/admin/mock-tests' },
            { icon: Zap, label: 'Daily Quiz', href: '/admin/daily-quizzes' },
            { icon: Calendar, label: 'Live Exams', href: '/admin/live-exams' },
            { icon: Plus, label: 'Question Management', href: '/admin/questions' },
            { icon: Layers, label: 'Hierarchy & Subjects', href: '/admin/hierarchy' },
            { icon: FileText, label: 'Previous Year Papers', href: '/admin/pyp' },
            { icon: Newspaper, label: 'News & Updates', href: '/admin/news' },
        ]
    },
    {
        title: 'MASTER DATA',
        items: [
            { icon: Tag, label: 'Categories', href: '/admin/master-data/categories' },
        ]
    },
    {
        title: 'AI & ANALYTICS',
        items: [
            { icon: Sparkles, label: 'AI Explanations', href: '/admin/ai-explanations' },
            { icon: TrendingUp, label: 'Analytics Dashboard', href: '/admin/analytics' },
            { icon: Users, label: 'Student Monitoring', href: '/admin/students' },
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
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
            <Sidebar
                customNavSections={adminNavSections}
                title="eRankUp Admin"
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-[90px]' : 'ml-[290px]'}`}>
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

                        <div ref={dropdownRef} className="flex items-center gap-3 pl-6 border-l border-slate-800 relative">
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-200">{user?.fullName || 'Admin User'}</div>
                                <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{user?.role || 'Administrator'}</div>
                            </div>
                            <button
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
                            >
                                {user?.fullName?.charAt(0) || 'A'}
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileDropdownOpen && (
                                <div className="absolute top-14 right-0 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                                    <div className="p-4 border-b border-slate-800">
                                        <div className="text-sm font-bold text-slate-200">{user?.fullName || 'Admin User'}</div>
                                        <div className="text-xs text-slate-400 mt-1">{user?.email}</div>
                                    </div>
                                    <div className="py-2">
                                        <Link
                                            href="/admin/settings"
                                            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span className="text-sm font-medium">Settings</span>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsProfileDropdownOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm font-medium">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 text-slate-100">
                    {children}
                </main>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    BookOpen,
    FileCheck,
    TrendingUp,
    Activity,
    ShieldCheck,
    AlertCircle,
    Banknote
} from 'lucide-react';
import AIServiceMonitor from '@/components/admin/AIServiceMonitor';
import SystemHealthWidget from '@/components/admin/SystemHealthWidget';
import api from '@/lib/api';

interface DashboardStats {
    activeStudents: number;
    totalExams: number;
    submissionsToday: number;
    revenueStats: {
        totalRevenue: number;
        currency: string;
        growth: string;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/analytics/overview');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading dashboard analytics...</div>;
    }

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col gap-1">
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Admin Overview
                </h1>
                <p className="text-slate-400 font-medium">System health and content performance at a glance.</p>
            </header>

            {/* Admin Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl shadow-black/20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-2xl shadow-inner shadow-cyan-500/5">
                            <Users className="w-5 h-5 text-cyan-500" />
                        </div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Students</span>
                    </div>
                    <div className="text-3xl font-black text-white leading-none">
                        {stats?.activeStudents || 0}
                    </div>
                    <div className="text-[10px] text-cyan-400 mt-2 font-bold px-2 py-0.5 bg-cyan-400/10 rounded-full w-fit">
                        Registered Users
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl shadow-black/20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl shadow-inner shadow-purple-500/5">
                            <BookOpen className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Exams</span>
                    </div>
                    <div className="text-3xl font-black text-white leading-none">
                        {stats?.totalExams || 0}
                    </div>
                    <div className="text-[10px] text-purple-400 mt-2 font-bold px-2 py-0.5 bg-purple-400/10 rounded-full w-fit">
                        Published Content
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl shadow-black/20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl shadow-inner shadow-emerald-500/5">
                            <FileCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Submissions</span>
                    </div>
                    <div className="text-3xl font-black text-white leading-none">
                        {stats?.submissionsToday || 0}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-2 font-bold px-2 py-0.5 bg-emerald-400/10 rounded-full w-fit">
                        Last 24 Hours
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl shadow-black/20"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl shadow-inner shadow-amber-500/5">
                            <Banknote className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-black text-white leading-none">
                        {stats?.revenueStats.currency} {stats?.revenueStats.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-400 mt-2 font-bold px-2 py-0.5 bg-amber-400/10 rounded-full w-fit">
                        {stats?.revenueStats.growth} from last month
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health Monitor */}
                <div className="lg:col-span-2">
                    <SystemHealthWidget />
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                        <AlertCircle className="w-5 h-5 text-blue-600" /> Maintenance
                    </h2>
                    <div className="space-y-4">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await api.post('/admin/system/clear-cache');
                                    alert(res.data.message || 'Cache cleared!');
                                } catch (e) {
                                    alert('Failed to clear cache');
                                }
                            }}
                            className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold transition-all border border-slate-200"
                        >
                            Clear Redis Cache
                        </button>
                        <button
                            onClick={async () => {
                                if (!confirm('Re-seeding will repopulate sample data. Are you sure?')) return;
                                try {
                                    const res = await api.post('/admin/system/re-seed');
                                    alert(res.data.message || 'Data re-seeded!');
                                } catch (e) {
                                    alert('Failed to re-seed data');
                                }
                            }}
                            className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold transition-all border border-slate-200"
                        >
                            Re-seed Sample Data
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await api.post('/admin/system/lockdown');
                                    alert(res.data.message || 'System lockdown toggled!');
                                } catch (e) {
                                    alert('Failed to toggle lockdown');
                                }
                            }}
                            className="w-full py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold hover:bg-red-100 transition-all"
                        >
                            System Lockdown
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthBar({ label, status, uptime }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
            <span className="font-medium">{label}</span>
            <div className="flex items-center gap-6">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">{uptime}</span>
                <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${status === 'Healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                    status === 'Warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                    {status}
                </span>
            </div>
        </div>
    );
}

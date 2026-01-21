'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Clock,
    Target,
    BookOpen,
    ChevronRight,
    TrendingUp,
    Zap,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface Stats {
    totalAttempts: number;
    averageScore: number;
    totalTimeTaken: number;
    accuracy: number;
    streak: number;
}

interface RecentAttempt {
    id: string;
    score: number;
    createdAt: string;
    model: {
        title: string;
    };
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, recentRes] = await Promise.all([
                    api.get('/exams/user/stats'),
                    api.get('/exams/user/recent')
                ]);
                setStats(statsRes.data);
                setRecentAttempts(recentRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-1 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#00bfa5]/20 via-transparent to-transparent shadow-2xl shadow-teal-500/10"
            >
                <div className="bg-white/80 backdrop-blur-3xl rounded-[2.4rem] p-10 md:p-12 relative overflow-hidden group border border-white/50">
                    {/* Mesh Gradient Background Layer */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-100/40 via-blue-50/20 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-100/30 to-transparent rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00bfa5]/10 text-[#00bfa5] text-[10px] font-black uppercase tracking-widest mb-6 border border-[#00bfa5]/20 shadow-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Preparation Status: Elite
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter text-slate-900 leading-[1.1]">
                            Welcome back, <br className="md:hidden" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00bfa5] via-teal-600 to-cyan-500">
                                {user?.fullName?.split(' ')[0] || 'Aspirant'}
                            </span>! 🚀
                        </h1>

                        <p className="text-slate-500 max-w-xl font-medium text-lg leading-relaxed mb-10">
                            You've mastered <span className="text-slate-900 font-bold">{stats?.totalAttempts || 0}</span> test cycles.
                            Your streak is heating up at <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg font-bold">{stats?.streak || 0} days</span>.
                        </p>

                        <div className="flex flex-wrap gap-5">
                            <Link
                                href="/dashboard/exams"
                                className="group/btn relative inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-bold transition-all hover:scale-[1.05] active:scale-95 shadow-2xl shadow-slate-900/30 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3 text-base">
                                    Start Practice <ChevronRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1.5" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#00bfa5] to-teal-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                            </Link>

                            <Link
                                href="/dashboard/study-plan"
                                className="relative inline-flex items-center gap-3 bg-white/50 backdrop-blur-xl border border-slate-200 text-slate-700 px-10 py-5 rounded-[1.5rem] font-bold transition-all hover:bg-white hover:border-[#00bfa5]/30 hover:shadow-xl hover:shadow-[#00bfa5]/5 active:scale-95 text-base"
                            >
                                Personalized Path
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        icon: <Trophy className="w-6 h-6" />,
                        label: "Average Score",
                        value: `${stats?.averageScore || 0}%`,
                        trend: "+5.2%",
                        color: "from-amber-400 to-orange-500",
                        bgColor: "bg-amber-500/10",
                        textColor: "text-amber-600"
                    },
                    {
                        icon: <CheckCircle2 className="w-6 h-6" />,
                        label: "Total Tests",
                        value: stats?.totalAttempts || 0,
                        trend: "On Track",
                        color: "from-emerald-400 to-teal-500",
                        bgColor: "bg-emerald-500/10",
                        textColor: "text-emerald-600"
                    },
                    {
                        icon: <Target className="w-6 h-6" />,
                        label: "Accuracy",
                        value: `${stats?.accuracy || 0}%`,
                        trend: "Elite 5%",
                        color: "from-cyan-400 to-blue-500",
                        bgColor: "bg-cyan-500/10",
                        textColor: "text-cyan-600"
                    },
                    {
                        icon: <Clock className="w-6 h-6" />,
                        label: "Study Time",
                        value: formatTime(stats?.totalTimeTaken || 0),
                        trend: "Peak Performance",
                        color: "from-indigo-400 to-violet-500",
                        bgColor: "bg-indigo-500/10",
                        textColor: "text-indigo-600"
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i + 0.3 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-white/50" />
                        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-4 rounded-2xl ${stat.bgColor} ${stat.textColor} shadow-inner transition-transform group-hover:rotate-6`}>
                                    {stat.icon}
                                </div>
                                <div className="text-[10px] font-black tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 uppercase">
                                    {stat.trend}
                                </div>
                            </div>
                            <div>
                                <div className="text-[32px] font-black text-slate-900 tracking-tighter mb-0.5 leading-none">
                                    {stat.value}
                                </div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    {stat.label}
                                </div>
                            </div>

                            {/* Decorative accent */}
                            <div className={`absolute -bottom-1 -right-1 w-12 h-12 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-xl`} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
                {/* Recent Activity */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-3xl font-black flex items-center gap-4 text-slate-900 tracking-tight">
                            <div className="w-12 h-12 bg-[#00bfa5]/10 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#00bfa5]" />
                            </div>
                            Recent Activity
                        </h2>
                        <Link href="/dashboard/performance" className="text-[10px] text-slate-400 hover:text-[#00bfa5] transition-all font-black uppercase tracking-[0.2em] flex items-center gap-2 group/link">
                            Browse History <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                        </Link>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 p-2">
                        {recentAttempts.length > 0 ? (
                            <div className="space-y-1">
                                {recentAttempts.map((attempt, idx) => {
                                    const isExcellent = attempt.score > 80;
                                    const isAverage = attempt.score > 60;

                                    return (
                                        <motion.div
                                            key={attempt.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * idx + 0.5 }}
                                        >
                                            <Link
                                                href={attempt.id ? `/dashboard/results/${attempt.id}` : '#'}
                                                className="group flex items-center justify-between p-5 md:p-6 rounded-[2rem] hover:bg-slate-50 transition-all duration-500 relative overflow-hidden"
                                            >
                                                <div className="flex items-center gap-5 relative z-10">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${isExcellent ? 'bg-emerald-50 text-emerald-600 shadow-emerald-200/50' :
                                                        isAverage ? 'bg-blue-50 text-blue-600 shadow-blue-200/50' :
                                                            'bg-orange-50 text-orange-600 shadow-orange-200/50'
                                                        }`}>
                                                        <BookOpen className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-extrabold text-[15px] text-slate-900 group-hover:text-[#00bfa5] transition-colors uppercase tracking-tight mb-0.5">
                                                            {attempt.model?.title || 'Practice Module'}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                {new Date(attempt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                            <div className="text-[10px] font-black text-[#00bfa5] uppercase tracking-widest">Mock Test</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 relative z-10">
                                                    <div className="text-right">
                                                        <div className="flex items-baseline gap-1 justify-end">
                                                            <span className={`text-2xl font-black tracking-tighter ${isExcellent ? 'text-emerald-600' : isAverage ? 'text-blue-600' : 'text-orange-600'
                                                                }`}>
                                                                {Math.round(attempt.score)}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-400">%</span>
                                                        </div>
                                                        {/* Activity Micro-Sparkline Mockup */}
                                                        <div className="w-16 h-1 mt-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${attempt.score}%` }}
                                                                transition={{ duration: 1, delay: 0.8 + idx * 0.1 }}
                                                                className={`h-full rounded-full ${isExcellent ? 'bg-emerald-500' : isAverage ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 bg-slate-100 group-hover:bg-[#00bfa5] rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6">
                                                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>

                                                {/* Hover Background Accent */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-[#00bfa5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <div className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                    No activity found
                                </div>
                                <p className="text-slate-300 text-xs mt-2">Start your preparation by taking your first mock test.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="px-4">
                        <h2 className="text-3xl font-black flex items-center gap-4 text-slate-900 tracking-tight">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-orange-500" />
                            </div>
                            For You
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 }}
                            className="bg-gradient-to-br from-[#1a237e] via-[#311b92] to-[#4527a0] p-10 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/30 border border-white/10"
                        >
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-2xl text-white text-[10px] font-black uppercase tracking-[0.15em] mb-8 border border-white/20 shadow-lg">
                                    <Sparkles className="w-4 h-4 text-yellow-300" /> Focus Recommendation
                                </div>
                                <h3 className="text-3xl font-black mb-5 leading-[1.2] tracking-tight">Master Geometry <br />Properties</h3>
                                <p className="text-indigo-100 text-[13px] leading-relaxed font-medium mb-10 opacity-80">
                                    Your accuracy in Triangle centers is <span className="text-emerald-300 font-bold text-base">28% lower</span> than the average topper.
                                </p>
                                <Link
                                    href="/dashboard/study-plan"
                                    className="group/deep relative block w-full text-center py-6 bg-white text-[#311b92] rounded-[1.8rem] font-bold text-[13px] uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.03] active:scale-95 overflow-hidden"
                                >
                                    <span className="relative z-10 transition-colors group-hover/deep:text-white">Start Deep Dive</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-[#00bfa5] opacity-0 group-hover/deep:opacity-100 transition-opacity duration-300" />
                                </Link>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-[80px]" />
                            <Target className="absolute top-10 -right-10 w-40 h-40 text-white/5 rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-1000" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.0 }}
                            className="group relative p-[2px] rounded-[3.2rem] overflow-hidden"
                        >
                            {/* Animated Neon "Reactor" Border */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0%,transparent_40%,#fbbf24_50%,transparent_60%,transparent_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-1000"
                            />

                            <div className="relative bg-[#0b0f1a] backdrop-blur-3xl p-10 rounded-[3.1rem] h-full transition-colors duration-700 group-hover:bg-[#0f1424]">
                                <div className="relative z-10 font-inter">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="relative overflow-hidden px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 group/badge shadow-2xl">
                                            {/* Holographic Shimmer Layer */}
                                            <motion.div
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent skew-x-12"
                                            />
                                            <div className="relative flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping shadow-[0_0_15px_#fbbf24]" />
                                                <span className="text-[12px] font-black text-white uppercase tracking-[0.3em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                    MOMENTUM <span className="text-amber-400">REACTOR</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                                            CORE: <span className="text-white">STABLE</span>
                                        </div>
                                    </div>

                                    <div className="space-y-8 mb-12">
                                        <div className="flex items-center gap-8">
                                            <div className="relative">
                                                <motion.div
                                                    animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                                                    transition={{ duration: 5, repeat: Infinity }}
                                                    className="text-8xl font-black text-white tracking-tighter leading-none select-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                                                >
                                                    {stats?.streak || 1}
                                                </motion.div>
                                                {/* Reactor Glow Ring */}
                                                <div className="absolute inset-0 bg-amber-500/5 blur-[40px] rounded-full -z-10 animate-pulse" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-amber-500 text-[14px] font-black uppercase tracking-[0.3em] leading-none">Day Streak</div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                                    <Zap className="w-3.5 h-3.5 fill-orange-400" /> Superconducting
                                                </div>
                                            </div>
                                        </div>

                                        {/* Liquid Consistency Tracker */}
                                        <div className="pt-6 border-t border-white/5 relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency Matrix</span>
                                                <div className="text-[11px] font-black text-amber-500 tracking-widest">S-RANK</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {[1, 2, 3, 4, 5, 6, 7].map((day, i) => (
                                                    <div key={day} className="flex-1 group/bead relative h-3 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
                                                        {i < (stats?.streak || 1) % 8 && (
                                                            <motion.div
                                                                initial={{ y: "100%" }}
                                                                animate={{ y: "0%" }}
                                                                transition={{ duration: 1, delay: i * 0.1 }}
                                                                className="absolute inset-0 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200"
                                                            >
                                                                {/* Liquid Bubble Animation */}
                                                                <motion.div
                                                                    animate={{ y: [-10, 10], x: [-2, 2] }}
                                                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                                    className="w-full h-full opacity-30 bg-white blur-sm"
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-slate-400 text-[13px] leading-relaxed font-medium mb-12 border-l-2 border-amber-500/30 pl-5 italic">
                                        "Focus is the accelerator. Consistency is the fuel." Your trajectory is currently <span className="text-white font-bold text-base shadow-white/10">unbounded</span>.
                                    </p>

                                    <Link
                                        href="/dashboard/study-plan"
                                        className="group/btn block relative"
                                    >
                                        <div className="absolute inset-0 bg-amber-500 blur-xl opacity-0 group-hover/btn:opacity-20 transition-opacity duration-500" />
                                        <div className="relative text-center py-6 bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 hover:border-amber-500/50 hover:text-amber-400">
                                            Ignite Pipeline
                                        </div>
                                    </Link>
                                </div>

                                {/* Reactor Core Backdrop Effects */}
                                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px]" />
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Custom Stat Card component is no longer used above as we map directly,
// but we'll remove it or update it if needed.
// For now, I've integrated it into the map logic above.

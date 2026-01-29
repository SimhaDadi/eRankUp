'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Search,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ActivePassBadge from '@/components/ActivePassBadge';
import DashboardSkeleton from '@/components/DashboardSkeleton';

import { Stats, RecentAttempt } from '@/types/dashboard.types';


export default function DashboardPage() {
    const { user, setActivePass } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
    const [allExams, setAllExams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, recentRes, examsRes, passRes] = await Promise.all([
                    api.get('/exams/user/stats'),
                    api.get('/exams/user/recent'),
                    api.get('/exams'),
                    api.get('/passes/current').catch(() => ({ data: null }))
                ]);
                setStats(statsRes.data);
                setRecentAttempts(Array.isArray(recentRes.data) ? recentRes.data : []);
                setAllExams(examsRes.data || []);
                setActivePass(passRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                // Keep it for a slightly longer time to make sure skeleton is visible for demo/smoothness
                setTimeout(() => setIsLoading(false), 300);
            }
        };

        fetchDashboardData();
    }, [setActivePass]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-7xl mx-auto"
                >
                    <DashboardSkeleton />
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4 pb-12 max-w-7xl mx-auto"
                >
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                    >
                        {/* Welcome Section - SPLIT LAYOUT */}
                        <motion.div
                            variants={itemVariants}
                            className="relative p-1 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#00bfa5]/30 via-teal-500/5 to-cyan-500/20 shadow-xl shadow-teal-500/10"
                        >
                            <div className="bg-white/90 backdrop-blur-3xl rounded-[1.9rem] p-5 md:p-6 relative overflow-hidden group border border-white/60">
                                {/* Mesh Gradient Background Layer */}
                                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-teal-100/60 via-cyan-50/30 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-105 transition-transform duration-1000" />
                                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-100/40 to-transparent rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                                    {/* Left Content */}
                                    <div className="flex-1 max-w-2xl">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00bfa5]/10 text-[#00bfa5] text-[10px] font-black uppercase tracking-widest mb-4 border border-[#00bfa5]/20 shadow-sm"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" /> Preparation Status: Elite
                                        </motion.div>

                                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter text-slate-900 leading-[1.05]">
                                            Welcome back, <br />
                                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00bfa5] via-teal-600 to-cyan-600">
                                                {user?.fullName?.split(' ')[0] || 'Aspirant'}
                                            </span>! 🚀
                                        </h1>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">SSC Focus</span>
                                            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">Railway Focus</span>
                                        </div>

                                        <p className="text-slate-500 max-w-lg font-bold text-lg leading-relaxed mb-6">
                                            Your SSC & Railway journey is peaking. You've mastered <span className="text-slate-900 font-extrabold text-xl">{stats?.totalAttempts || 0}</span> test cycles.
                                            Daily streak: <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-xl font-black border border-orange-200">{stats?.streak || 0} days</span>.
                                        </p>

                                        <div className="flex flex-wrap gap-4">
                                            <Link
                                                href="/dashboard/test-series"
                                                className="group/btn relative inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-[1.25rem] font-bold transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-slate-900/20 overflow-hidden"
                                            >
                                                <span className="relative z-10 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                    Start Practice <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-[#00bfa5] to-teal-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                            </Link>

                                            <Link
                                                href="/dashboard/study-plan"
                                                className="relative inline-flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-[1.25rem] font-bold transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 text-sm uppercase tracking-wider"
                                            >
                                                Personalized Path
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right Visualization - Daily Goal Ring */}
                                    <div className="relative w-full md:w-[280px] aspect-square flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-white rounded-full opacity-50 blur-3xl" />
                                        <div className="relative h-full bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-2xl flex items-center justify-center p-6">
                                            {/* Rings */}
                                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                                {/* Background Ring */}
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                                                {/* Progress Ring */}
                                                <motion.circle
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: Math.min((stats?.dailyQuestions || 0) / 100, 1) }}
                                                    transition={{ duration: 2, ease: "easeOut" }}
                                                    cx="50" cy="50" r="45"
                                                    fill="none"
                                                    stroke="url(#gradient)"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray="1 1"
                                                    strokeDashoffset="0"
                                                />
                                                <defs>
                                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#00bfa5" />
                                                        <stop offset="100%" stopColor="#2dd4bf" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>

                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Daily Goal</div>
                                                <div className="text-5xl font-black text-slate-900 tracking-tighter">
                                                    {Math.round(Math.min(((stats?.dailyQuestions || 0) / 100) * 100, 100))}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Active Pass Badge */}
                        <motion.div variants={itemVariants}>
                            <ActivePassBadge />
                        </motion.div>

                        {/* Stats Grid - REDESIGNED & DENSER */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    icon: <Trophy className="w-5 h-5" />,
                                    label: "Average Score",
                                    value: `${stats?.averageScore || 0}%`,
                                    trend: "+5.2%",
                                    color: "from-amber-400 to-orange-500",
                                    bgColor: "bg-amber-500/10",
                                    textColor: "text-amber-600",
                                    chart: (
                                        <div className="h-10 flex items-end gap-1 opacity-50">
                                            {[40, 60, 45, 70, 50, 65, 80].map((h, i) => (
                                                <div key={i} className="flex-1 bg-amber-500 rounded-t-sm" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    )
                                },
                                {
                                    icon: <CheckCircle2 className="w-5 h-5" />,
                                    label: "Total Tests",
                                    value: stats?.totalAttempts || 0,
                                    trend: "On Track",
                                    color: "from-emerald-400 to-teal-500",
                                    bgColor: "bg-emerald-500/10",
                                    textColor: "text-emerald-600",
                                    chart: (
                                        <div className="h-10 w-10 relative ml-auto">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#d1fae5" strokeWidth="4" />
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="80, 100" />
                                            </svg>
                                        </div>
                                    )
                                },
                                {
                                    icon: <Target className="w-5 h-5" />,
                                    label: "Accuracy",
                                    value: `${stats?.accuracy || 0}%`,
                                    trend: "Elite 5%",
                                    color: "from-cyan-400 to-blue-500",
                                    bgColor: "bg-cyan-500/10",
                                    textColor: "text-cyan-600",
                                    chart: (
                                        <div className="h-10 flex items-center justify-end gap-1">
                                            <div className="w-10 h-10 rounded-full border-[3px] border-cyan-500 flex items-center justify-center bg-cyan-50 text-[8px] font-black text-cyan-600">
                                                TOP
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    icon: <Clock className="w-5 h-5" />,
                                    label: "Study Time",
                                    value: formatTime(stats?.totalTimeTaken || 0),
                                    trend: "Peak Performance",
                                    color: "from-indigo-400 to-violet-500",
                                    bgColor: "bg-indigo-500/10",
                                    textColor: "text-indigo-600",
                                    chart: (
                                        <div className="h-8 flex items-center gap-0.5 opacity-60">
                                            {[1, 2, 3, 2, 4, 3, 5].map((h, i) => (
                                                <div key={i} className="w-1.5 h-full bg-indigo-200 rounded-full overflow-hidden relative">
                                                    <div className="absolute bottom-0 left-0 w-full bg-indigo-500 rounded-full" style={{ height: `${h * 20}%` }} />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    variants={itemVariants}
                                    whileHover={{ y: -5 }}
                                    className="group relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-white/50" />
                                    <div className="bg-white p-4 rounded-[1.5rem] border border-slate-200/60 shadow-lg shadow-slate-200/20 relative overflow-hidden h-full flex flex-col justify-between ring-1 ring-slate-900/5 hover:border-slate-300 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-10 h-10 rounded-2xl ${stat.bgColor} ${stat.textColor} flex items-center justify-center shadow-inner`}>
                                                {stat.icon}
                                            </div>
                                            {stat.chart}
                                        </div>

                                        <div className="relative z-10">
                                            <div className="text-2xl font-black text-slate-900 tracking-tighter mb-1 leading-none">
                                                {stat.value}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {stat.label}
                                                </div>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${stat.bgColor} ${stat.textColor} uppercase tracking-wider`}>
                                                    {stat.trend}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                            {/* Recent Activity */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                                        <div className="w-10 h-10 bg-[#00bfa5]/10 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-[#00bfa5]" />
                                        </div>
                                        Recent Activity
                                    </h2>
                                    <Link href="/dashboard/activity" className="text-[10px] text-slate-400 hover:text-[#00bfa5] transition-all font-black uppercase tracking-[0.2em] flex items-center gap-2 group/link">
                                        History <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                    </Link>
                                </div>

                                {searchQuery && (
                                    <div className="space-y-4 mb-8">
                                        <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 tracking-tight px-2">
                                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                <Search className="w-4 h-4 text-blue-600" />
                                            </div>
                                            Global Matches
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {allExams.filter(exam =>
                                                exam.title.toLowerCase().includes(searchQuery.toLowerCase())
                                            ).slice(0, 3).map((exam) => (
                                                <motion.div
                                                    key={exam.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            <Zap className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{exam.category || 'General'}</span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 text-sm mb-3 line-clamp-1">{exam.title}</h3>
                                                    <Link
                                                        href={`/dashboard/exams/${exam.id}`}
                                                        className="w-full flex items-center justify-center py-2 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-[#00bfa5] rounded-xl hover:bg-[#00bfa5] hover:text-white transition-all"
                                                    >
                                                        Take Now
                                                    </Link>
                                                </motion.div>
                                            ))}
                                            {allExams.filter(exam =>
                                                exam.title.toLowerCase().includes(searchQuery.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="col-span-full py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No global matches found for "{searchQuery}"</p>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200/30 p-2">
                                    {(() => {
                                        const filtered = (recentAttempts || []).filter(attempt => {
                                            const title = (attempt.exam?.title || attempt.model?.title || '').toLowerCase();
                                            return title.includes(searchQuery.toLowerCase());
                                        });

                                        if (filtered.length > 0) {
                                            return (
                                                <div className="space-y-1">
                                                    {filtered.map((attempt, idx) => {
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
                                                                    className="group flex items-center justify-between p-3 rounded-[1.8rem] hover:bg-slate-50 transition-all duration-300 relative overflow-hidden border border-transparent hover:border-slate-100"
                                                                >
                                                                    <div className="flex items-center gap-4 relative z-10">
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white shadow-md transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 ${isExcellent ? 'bg-emerald-50 text-emerald-600 shadow-emerald-200/50' :
                                                                            isAverage ? 'bg-blue-50 text-blue-600 shadow-blue-200/50' :
                                                                                'bg-orange-50 text-orange-600 shadow-orange-200/50'
                                                                            }`}>
                                                                            <BookOpen className="w-4 h-4" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-sm text-slate-900 group-hover:text-[#00bfa5] transition-colors uppercase tracking-tight mb-0.5 max-w-[180px] truncate">
                                                                                {attempt.exam?.title || attempt.model?.title || 'Practice Module'}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                                    {new Date(attempt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                </div>
                                                                                <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
                                                                                <div className="text-[9px] font-black text-[#00bfa5] uppercase tracking-widest">Mock Test</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-6 relative z-10">
                                                                        <div className="text-right hidden sm:block">
                                                                            <div className="flex items-baseline gap-0.5 justify-end">
                                                                                <span className={`text-xl font-black tracking-tighter ${isExcellent ? 'text-emerald-600' : isAverage ? 'text-blue-600' : 'text-orange-600'
                                                                                    }`}>
                                                                                    {Math.round(attempt.score)}
                                                                                </span>
                                                                                <span className="text-[10px] font-bold text-slate-400">%</span>
                                                                            </div>
                                                                            <div className="w-12 h-1 mt-1 bg-slate-100 rounded-full overflow-hidden ml-auto">
                                                                                <motion.div
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${attempt.score}%` }}
                                                                                    transition={{ duration: 1, delay: 0.8 + idx * 0.1 }}
                                                                                    className={`h-full rounded-full ${isExcellent ? 'bg-emerald-500' : isAverage ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-8 h-8 bg-slate-50 group-hover:bg-[#00bfa5] rounded-lg flex items-center justify-center transition-all group-hover:scale-110">
                                                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-[#00bfa5]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </Link>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="p-20 text-center">
                                                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                        <Search className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                                        {searchQuery ? `No results for "${searchQuery}"` : 'No activity found'}
                                                    </div>
                                                    <p className="text-slate-300 text-xs mt-2">
                                                        {searchQuery ? 'Try a different search term.' : 'Start your preparation by taking your first mock test.'}
                                                    </p>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>

                            {/* AI Recommendations */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="px-2">
                                    <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-orange-500" />
                                        </div>
                                        For You
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="bg-gradient-to-br from-[#1a237e] via-[#311b92] to-[#4527a0] p-6 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl shadow-indigo-500/30 border border-white/10"
                                    >
                                        <div className="relative z-10">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-2xl text-white text-[9px] font-black uppercase tracking-[0.15em] mb-4 border border-white/20 shadow-lg">
                                                <Sparkles className="w-3 h-3 text-yellow-300" /> Focus Recommendation
                                            </div>
                                            <h3 className="text-2xl font-black mb-3 leading-[1.2] tracking-tight">Master History <br />& GS for SSC</h3>
                                            <p className="text-indigo-100 text-xs leading-relaxed font-medium mb-8 opacity-80">
                                                Your accuracy in Indian History is <span className="text-emerald-300 font-bold">15% lower</span> than RRB NTPC toppers.
                                            </p>
                                            <Link
                                                href="/dashboard/study-plan"
                                                className="group/deep relative block w-full text-center py-4 bg-white text-[#311b92] rounded-[1.2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.03] active:scale-95 overflow-hidden"
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
                                        className="group relative p-[2px] rounded-[2.5rem] overflow-hidden"
                                    >
                                        {/* Animated Neon "Reactor" Border */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0%,transparent_40%,#fbbf24_50%,transparent_60%,transparent_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-1000"
                                        />

                                        <div className="relative bg-[#0b0f1a] backdrop-blur-3xl p-6 rounded-[2.4rem] h-full transition-colors duration-700 group-hover:bg-[#0f1424]">
                                            <div className="relative z-10 font-inter">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="relative overflow-hidden px-4 py-2 rounded-xl bg-white/5 border border-white/10 group/badge shadow-xl">
                                                        {/* Holographic Shimmer Layer */}
                                                        <motion.div
                                                            animate={{ x: ['-100%', '200%'] }}
                                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent skew-x-12"
                                                        />
                                                        <div className="relative flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping shadow-[0_0_15px_#fbbf24]" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                                MOMENTUM <span className="text-amber-400">REACTOR</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6 mb-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="relative">
                                                            <motion.div
                                                                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                                                                transition={{ duration: 5, repeat: Infinity }}
                                                                className="text-6xl font-black text-white tracking-tighter leading-none select-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                                                            >
                                                                {stats?.streak || 1}
                                                            </motion.div>
                                                            {/* Reactor Glow Ring */}
                                                            <div className="absolute inset-0 bg-amber-500/5 blur-[30px] rounded-full -z-10 animate-pulse" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-amber-500 text-[11px] font-black uppercase tracking-[0.3em] leading-none">Day Streak</div>
                                                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-500/20">
                                                                <Zap className="w-3 h-3 fill-orange-400" /> Superconducting
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Liquid Consistency Tracker */}
                                                    <div className="pt-4 border-t border-white/5 relative">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency Matrix</span>
                                                            <div className="text-[10px] font-black text-amber-500 tracking-widest">S-RANK</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {[1, 2, 3, 4, 5, 6, 7].map((day, i) => (
                                                                <div key={day} className="flex-1 group/bead relative h-2.5 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
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

                                                <Link
                                                    href="/dashboard/study-plan"
                                                    className="group/btn block relative"
                                                >
                                                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-0 group-hover/btn:opacity-20 transition-opacity duration-500" />
                                                    <div className="relative text-center py-4 bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 hover:border-amber-500/50 hover:text-amber-400">
                                                        Ignite Pipeline
                                                    </div>
                                                </Link>
                                            </div>

                                            {/* Reactor Core Backdrop Effects */}
                                            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/5 rounded-full blur-[100px]" />
                                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div >
            )
            }
        </AnimatePresence >
    );
}

// Custom Stat Card component is no longer used above as we map directly,
// but we'll remove it or update it if needed.
// For now, I've integrated it into the map logic above.

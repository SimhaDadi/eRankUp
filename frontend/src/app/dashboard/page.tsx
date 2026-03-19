'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
    Trophy,
    Clock,
    Target,
    BookOpen,
    ChevronRight,
    Zap,
    CheckCircle2,
    Sparkles,
    Search,
    Edit2,
    Settings2,
    Share2,
    Shield,
    Star,
    TrendingUp as TrendingIcon,
    Briefcase,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ActivePassBadge from '@/components/ActivePassBadge';
import DashboardSkeleton from '@/components/DashboardSkeleton';
// import AiDoubtSolver from '@/components/AiDoubtSolver';

import { Stats, RecentAttempt } from '@/types/dashboard.types';


export default function DashboardPage() {
    const { user, setActivePass } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
    const [allExams, setAllExams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAiDoubtSolver, setShowAiDoubtSolver] = useState(true);
    const [showIntensityMenu, setShowIntensityMenu] = useState(false);
    const [revisionData, setRevisionData] = useState<any>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, recentRes, examsRes, gamiRes, revisionRes] = await Promise.all([
                    api.get('/exams/user/stats'),
                    api.get('/exams/user/recent?limit=5'),
                    api.get('/exams'),
                    api.get('/gamification/profile').catch(() => ({ data: {} })),
                    api.get('/ai-study/revision').catch(() => ({ data: null }))
                ]);

                const combinedStats = {
                    ...statsRes.data,
                    totalXp: gamiRes.data.totalXp,
                    level: gamiRes.data.level,
                    badges: gamiRes.data.badges,
                    dailyQuestionTarget: gamiRes.data.dailyQuestionTarget || statsRes.data.dailyQuestionTarget || 25
                };

                setStats(combinedStats);
                setRecentAttempts(Array.isArray(recentRes.data) ? recentRes.data : []);

                // Handle paginated response
                const examsData = examsRes.data;
                if (examsData?.data && Array.isArray(examsData.data)) {
                    setAllExams(examsData.data);
                } else if (Array.isArray(examsData)) {
                    setAllExams(examsData);
                } else {
                    setAllExams([]);
                }

                setRevisionData(revisionRes?.data || null);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                // Keep it for a slightly longer time to make sure skeleton is visible for demo/smoothness
                setTimeout(() => setIsLoading(false), 300);
            }
        };

        fetchDashboardData();
    }, [setActivePass]);

    const getModeConfig = (target: number) => {
        if (target >= 500) return {
            label: 'Beast Mode',
            icon: <Zap className="w-3 h-3 fill-amber-600 text-amber-600" />,
            gradient: "from-amber-50 via-orange-50 to-amber-100 border-amber-200",
            primary: "#f59e0b",
            message: "KEEP GOING! UNLEASH THE BEAST. 🦁",
            share: "I just smashed my daily goal in BEAST MODE on eRankUp! 🦁🔥",
            textClass: "text-amber-900"
        };
        if (target >= 200) return {
            label: 'Warrior Mode',
            icon: <Shield className="w-3 h-3 fill-rose-600 text-rose-600" />,
            gradient: "from-rose-50 via-red-50 to-rose-100 border-rose-200",
            primary: "#e11d48",
            message: "CHARGE AHEAD! NEARLY THERE. 🛡️",
            share: "I'm fighting my way to the top in Warrior Mode on eRankUp! ⚔️",
            textClass: "text-rose-900"
        };
        if (target >= 100) return {
            label: 'Pro Mode',
            icon: <Star className="w-3 h-3 fill-blue-600 text-blue-600" />,
            gradient: "from-blue-50 via-indigo-50 to-blue-100 border-blue-200",
            primary: "#2563eb",
            message: "FOCUS ON THE TARGET. 🎯",
            share: "Pro Mode activated! 🎯 My prep is on point with eRankUp.",
            textClass: "text-blue-900"
        };
        if (target >= 50) return {
            label: 'Steady Mode',
            icon: <TrendingIcon className="w-3 h-3 text-emerald-600" />,
            gradient: "from-emerald-50 via-green-50 to-emerald-100 border-emerald-200",
            primary: "#059669",
            message: "SLOW AND STEADY WINS THE RACE. 🍀",
            share: "Maintaining consistency with Steady Mode on eRankUp! 🐢",
            textClass: "text-emerald-900"
        };
        return {
            label: 'Institutional Starter',
            icon: <Briefcase className="w-3 h-3 fill-slate-600 text-slate-600" />,
            gradient: "from-slate-50 via-gray-50 to-slate-100 border-slate-200",
            primary: "#475569",
            message: "BUILDING STEADY MOMENTUM. 📈",
            share: "Started my institutional prep journey on eRankUp! 🐣",
            textClass: "text-slate-900"
        };
    };

    const modeConfig = useMemo(() => getModeConfig(stats?.dailyQuestionTarget || 25), [stats?.dailyQuestionTarget]);

    const handleShareProgress = async () => {
        if (!cardRef.current) return;

        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'erankup-achievement.png', { type: 'image/png' });

            const progress = Math.round(Math.min(((stats?.dailyQuestions || 0) / Math.max(stats?.dailyQuestionTarget || 100, 1)) * 100, 100));

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'eRankUp Achievement',
                    text: `${modeConfig.share} ${progress}% Completed! 🚀`,
                });
            } else {
                // Fallback to direct download
                const link = document.createElement('a');
                link.download = 'erankup-achievement.png';
                link.href = dataUrl;
                link.click();
                alert('Achievement image saved! Share it with your friends.');
            }
        } catch (error) {
            console.error('Error sharing progress:', error);
            alert('Failed to generate sharing image. Please try again.');
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const router = useRouter();
    const handleStartRevision = async () => {
        try {
            await api.post('/test-session/start/revision');
            router.push('/dashboard/test/smart-revision');
        } catch (error) {
            console.error("Failed to start revision session", error);
            alert("Failed to start revision session. Please try again later.");
        }
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
                        className="space-y-8"
                    >
                        {/* AI Revision CTA */}
                        {revisionData?.available && (
                            <motion.div variants={itemVariants} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">AI Smart Study</span>
                                        </div>
                                        <h2 className="text-3xl font-black mb-2">Weekly Polish Ready!</h2>
                                        <p className="text-indigo-100 font-medium max-w-xl text-lg">
                                            {revisionData.message}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleStartRevision}
                                        className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 group"
                                    >
                                        <Zap className="w-5 h-5 fill-indigo-600 group-hover:animate-pulse" />
                                        Start Revision
                                    </button>
                                </div>
                            </motion.div>
                        )}
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

                                    {/* Right Visualization - Daily Goal Institutional Card */}
                                    <div className="relative w-full md:w-[320px] flex-shrink-0 group/goal">
                                        <div
                                            ref={cardRef}
                                            className={`rounded-[1.5rem] p-5 text-slate-800 relative overflow-hidden shadow-lg border transition-all duration-500 bg-white bg-gradient-to-br ${modeConfig.gradient}`}
                                        >
                                            {/* Holographic Pattern Background */}
                                            {/* Holographic Pattern Background */}
                                            <div className="absolute inset-0 opacity-[0.05]" style={{
                                                backgroundImage: `linear-gradient(45deg, transparent 45%, white 45%, white 55%, transparent 55%)`,
                                                backgroundSize: '24px 24px'
                                            }}></div>

                                            {/* Top Glossy Light Source */}
                                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent z-0 pointer-events-none"></div>

                                            {/* Animated Background Glow */}
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[80px] -mr-24 -mt-24"
                                            ></motion.div>

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white/40 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-white/20">
                                                        {modeConfig.icon}
                                                        {modeConfig.label}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-50">
                                                        <Shield className="w-2.5 h-2.5" />
                                                        <span className="text-[7px] font-black tracking-tighter uppercase">Verified Achievement</span>
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <h3 className={`text-2xl font-black mb-0.5 leading-tight tracking-tighter ${modeConfig.textClass}`}>
                                                        {Math.round(Math.min(((stats?.dailyQuestions || 0) / Math.max(stats?.dailyQuestionTarget || 100, 1)) * 100, 100))}%
                                                        <span className="text-[10px] ml-1 opacity-70">COMPLETED</span>
                                                    </h3>
                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${modeConfig.textClass} opacity-80`}>
                                                        {Math.min(((stats?.dailyQuestions || 0) / Math.max(stats?.dailyQuestionTarget || 100, 1)) * 100, 100) >= 100
                                                            ? "APEX ACHIEVED! 🔥"
                                                            : modeConfig.message}
                                                    </p>
                                                </div>

                                                {/* Sleek Progress Bar */}
                                                <div className="relative h-2.5 bg-black/10 rounded-full overflow-hidden mb-4 border border-white/20 shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(((stats?.dailyQuestions || 0) / Math.max(stats?.dailyQuestionTarget || 100, 1)) * 100, 100)}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="absolute inset-0 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] rounded-full"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            onClick={() => setShowIntensityMenu(!showIntensityMenu)}
                                                            className="w-7 h-7 rounded-lg bg-white/40 flex items-center justify-center border border-white/30 hover:bg-white/60 transition-colors cursor-pointer shadow-sm"
                                                            title="Adjust Intensity"
                                                        >
                                                            <Settings2 className="w-3.5 h-3.5 text-slate-700" />
                                                        </div>
                                                        <div
                                                            onClick={handleShareProgress}
                                                            className="w-7 h-7 rounded-lg bg-white/40 flex items-center justify-center border border-white/30 hover:bg-white/60 transition-colors cursor-pointer shadow-sm"
                                                            title="Share Progress"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5 text-slate-700" />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowIntensityMenu(!showIntensityMenu)}
                                                        className={`text-[9px] font-black uppercase tracking-widest transition-colors ${modeConfig.textClass} hover:opacity-80`}
                                                    >
                                                        UPGRADE MODE {' > '}
                                                    </button>
                                                </div>

                                                {/* Verification Footer */}
                                                <div className="pt-3 border-t border-black/5 flex items-center justify-between opacity-40">
                                                    <div className="text-[6px] font-black tracking-[0.1em] uppercase">
                                                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                    </div>
                                                    <div className="bg-black/5 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold tracking-widest text-slate-900">
                                                        ERU-{(user?.id?.slice(-4).toUpperCase() || 'ACHV') + Math.floor(Math.random() * 10000)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Intensity Overlay Menu */}
                                            <AnimatePresence>
                                                {showIntensityMenu && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 flex flex-col justify-center gap-2 border border-slate-200 shadow-2xl rounded-[2rem]"
                                                    >
                                                        <div className="mb-4 text-center">
                                                            <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em]">Select Intensity</h4>
                                                            <div className="h-0.5 w-8 bg-amber-500 mx-auto mt-1 rounded-full opacity-50"></div>
                                                        </div>

                                                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                                                            {[
                                                                { v: 25, l: 'Starter', c: 'slate' },
                                                                { v: 50, l: 'Steady Mode', c: 'emerald' },
                                                                { v: 100, l: 'Pro Mode', c: 'blue' },
                                                                { v: 200, l: 'Warrior', c: 'rose' },
                                                                { v: 500, l: 'Beast Mode', c: 'amber' }
                                                            ].map((t) => (
                                                                <button
                                                                    key={t.v}
                                                                    onClick={async () => {
                                                                        const previousTarget = stats?.dailyQuestionTarget;
                                                                        
                                                                        // Optimistic UI update for immediate feedback
                                                                        setStats(prev => ({ ...(prev || {} as Stats), dailyQuestionTarget: t.v }));
                                                                        setShowIntensityMenu(false);
                                                                        
                                                                        try {
                                                                            await api.post('/gamification/daily-target', { target: t.v });
                                                                            // Optionally, we could re-fetch data here if needed
                                                                        } catch (e) {
                                                                            console.error("Failed to update daily target:", e);
                                                                            // Revert on failure
                                                                            if (previousTarget) {
                                                                                setStats(prev => ({ ...(prev || {} as Stats), dailyQuestionTarget: previousTarget }));
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${(stats?.dailyQuestionTarget || 100) === t.v
                                                                        ? 'bg-amber-50 text-amber-900 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                                        : 'bg-white text-slate-900 border-slate-900/10 hover:border-slate-900/30 hover:bg-slate-50'
                                                                        }`}
                                                                >
                                                                    {t.l}
                                                                    <span className="ml-2 opacity-60 text-[8px]">({t.v} Qs)</span>
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <button
                                                            onClick={() => setShowIntensityMenu(false)}
                                                            className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Streak Badge Overlay */}
                                            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full blur-2xl"></div>
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
                                    icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
                                    label: "Tests Taken",
                                    value: stats?.totalAttempts || 0,
                                    trend: "Consistent",
                                    gradient: "from-indigo-50 via-blue-50 to-indigo-100",
                                    shadow: "shadow-indigo-200/50",
                                    textClass: "text-indigo-900",
                                    border: "border-indigo-100"
                                },
                                {
                                    icon: <TrendingIcon className="w-5 h-5 text-emerald-600" />,
                                    label: "Average Score",
                                    value: `${stats?.averageScore || 0}%`,
                                    trend: "Improving",
                                    gradient: "from-emerald-50 via-teal-50 to-emerald-100",
                                    shadow: "shadow-emerald-200/50",
                                    textClass: "text-emerald-900",
                                    border: "border-emerald-100"
                                },
                                {
                                    icon: <Trophy className="w-5 h-5 text-amber-600" />,
                                    label: "Best Performance",
                                    value: `${stats?.bestScore || 0}%`,
                                    trend: "Elite",
                                    gradient: "from-amber-50 via-orange-50 to-amber-100",
                                    shadow: "shadow-amber-200/50",
                                    textClass: "text-amber-900",
                                    border: "border-amber-100"
                                },
                                {
                                    icon: <Target className="w-5 h-5 text-purple-600" />,
                                    label: "Global Rank",
                                    value: stats?.rank || '#-',
                                    trend: "Top 5%",
                                    gradient: "from-purple-50 via-violet-50 to-purple-100",
                                    shadow: "shadow-purple-200/50",
                                    textClass: "text-purple-900",
                                    border: "border-purple-100"
                                }
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="group relative h-full"
                                >
                                    <div className={`bg-gradient-to-br ${stat.gradient} p-5 rounded-xl ${stat.shadow} relative overflow-hidden h-full flex flex-col justify-between border ${stat.border || 'border-slate-100'}`}>
                                        {/* Dynamic Icon Overaly */}
                                        <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                            {stat.icon}
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2.5 bg-white rounded-lg shadow-sm border border-white/50">
                                                {stat.icon}
                                            </div>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full bg-white/60 ${stat.textClass} uppercase tracking-widest backdrop-blur-sm border border-white/20`}>
                                                {stat.trend}
                                            </span>
                                        </div>

                                        <div className="relative z-10">
                                            <div className={`text-3xl font-black tracking-tighter mb-0.5 leading-none ${stat.textClass || 'text-slate-900'}`}>
                                                {stat.value}
                                            </div>
                                            <div className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${stat.textClass || 'text-slate-900'} opacity-70`}>
                                                {stat.label}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* Left Column - Main Content (2/3) */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Focus Recommendation - Promoted to top of main column */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="bg-gradient-to-r from-[#1a237e] via-[#311b92] to-[#4527a0] p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl shadow-indigo-500/30 border border-white/10"
                                >
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-2xl text-white text-[9px] font-black uppercase tracking-[0.15em] mb-4 border border-white/20 shadow-lg">
                                                <Sparkles className="w-3 h-3 text-yellow-300" /> AI Recommended Focus
                                            </div>
                                            <h3 className="text-3xl font-black mb-3 leading-[1.2] tracking-tight text-white">Master History <br />& GS for SSC</h3>
                                            <p className="text-indigo-100 text-sm leading-relaxed font-medium max-w-lg opacity-80">
                                                Your accuracy in Indian History is <span className="text-emerald-300 font-bold">15% lower</span> than RRB NTPC toppers. Master this to reach S-Rank.
                                            </p>
                                        </div>
                                        <Link
                                            href="/dashboard/study-plan"
                                            className="group/deep relative whitespace-nowrap px-8 py-5 bg-white text-[#311b92] rounded-[1.2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.03] active:scale-95 overflow-hidden"
                                        >
                                            <span className="relative z-10 transition-colors group-hover/deep:text-white">Start Deep Dive</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-[#00bfa5] opacity-0 group-hover/deep:opacity-100 transition-opacity duration-300" />
                                        </Link>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-[80px]" />
                                    <Target className="absolute top-10 -right-10 w-40 h-40 text-white/5 rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-1000" />
                                </motion.div>

                                {/* Recent Activity */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                                            <div className="w-10 h-10 bg-[#00bfa5]/10 rounded-xl flex items-center justify-center">
                                                <TrendingIcon className="w-5 h-5 text-[#00bfa5]" />
                                            </div>
                                            Recent Activity
                                        </h2>
                                        <Link href="/dashboard/activity" className="text-[10px] text-slate-400 hover:text-[#00bfa5] transition-all font-black uppercase tracking-[0.2em] flex items-center gap-2 group/link">
                                            History <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                        </Link>
                                    </div>

                                    {searchQuery && (
                                        <div className="space-y-4 mb-4">
                                            <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 tracking-tight px-2">
                                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                    <Search className="w-4 h-4 text-blue-600" />
                                                </div>
                                                Global Matches
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {allExams.filter(exam =>
                                                    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
                                                ).slice(0, 2).map((exam) => (
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
                            </div>

                            {/* Right Column - Sidebar (1/3) */}
                            <div className="space-y-6">
                                {/* Gamification Quick Stats */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.2 }}
                                    className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-xl shadow-slate-200/10 relative overflow-hidden group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                                <Trophy className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 tracking-tight leading-none">Level {stats?.level || 1}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Preparation Tier</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900 leading-none">{stats?.totalXp || 0}</div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total XP</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Progress to Level {(stats?.level || 1) + 1}</span>
                                            <span>{Math.round(((stats?.totalXp || 0) % 500) / 5)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((stats?.totalXp || 0) % 500) / 5}%` }}
                                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                            />
                                        </div>
                                    </div>

                                    {/* Badges Preview */}
                                    {stats?.badges && stats.badges.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achievements</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {stats.badges.slice(0, 4).map((badge: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform cursor-help"
                                                        title={badge.name}
                                                    >
                                                        {badge.icon || '🏅'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Momentum Reactor - Moved to sidebar */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.0 }}
                                    className="group relative p-[2px] rounded-[2.5rem] overflow-hidden shadow-xl"
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
                                                    <motion.div
                                                        animate={{ x: ['-100%', '200%'] }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent skew-x-12"
                                                    />
                                                    <div className="relative flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping shadow-[0_0_15px_#fbbf24]" />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
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
                                                        <div className="absolute inset-0 bg-amber-500/5 blur-[30px] rounded-full -z-10 animate-pulse" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-amber-500 text-[11px] font-black uppercase tracking-[0.3em] leading-none">Day Streak</div>
                                                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-500/20">
                                                            <Zap className="w-3 h-3 fill-orange-400" /> Superconducting
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-white/5 relative">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency</span>
                                                        <div className="text-[10px] font-black text-amber-500 tracking-widest">S-RANK</div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {[1, 2, 3, 4, 5, 6, 7].map((day, i) => (
                                                            <div key={day} className="flex-1 group/bead relative h-2.5 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
                                                                {i < (stats?.streak || 1) % 8 && (
                                                                    <motion.div
                                                                        initial={{ y: "100%" }}
                                                                        animate={{ y: "0%" }}
                                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                                        className="absolute inset-0 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200"
                                                                    />
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
                                    </div>
                                </motion.div>
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

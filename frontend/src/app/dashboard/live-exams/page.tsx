'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout,
    Calendar,
    Clock,
    Search,
    ChevronDown,
    Loader2,
    BookOpen,
    HelpCircle,
    PlayCircle,
    Sparkles,
    Zap,
    Activity,
    Shield,
    Trophy
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PremiumEmptyState from '@/components/ui/PremiumEmptyState';

interface Exam {
    id: string;
    title: string;
    description: string;
    type: string;
    category?: string;
    createdAt: string;
    questionCount?: number;
    duration?: number;
    startTime?: string;
    endTime?: string;
    attempts?: {
        count: number;
        latestAttemptId: string;
    };
}

export default function LiveExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';


    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await api.get('/exams?type=live_exam');
                const liveExams = Array.isArray(response.data)
                    ? response.data.filter((e: Exam) => e.type === 'live_exam')
                    : [];
                setExams(liveExams);
            } catch (error) {
                console.error("Failed to fetch Live exams", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExams();
    }, []);

    // Extract unique categories
    const categories = ['All', ...Array.from(new Set(exams.map(e => e.category || 'Uncategorized')))];

    const filteredExams = exams.filter(exam => {
        const matchesCategory = selectedCategory === 'All' || (exam.category || 'Uncategorized') === selectedCategory;
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });


    const getStatus = (exam: Exam) => {
        const now = new Date();
        const start = exam.startTime ? new Date(exam.startTime) : null;
        const end = exam.endTime ? new Date(exam.endTime) : null;

        if (!start || !end) return { label: 'Live Now', color: 'bg-red-50 text-red-600 border-red-100', animate: true };

        if (now < start) return { label: 'Upcoming', color: 'bg-amber-50 text-amber-600 border-amber-100', animate: false };
        if (now >= start && now <= end) return { label: 'Live Now', color: 'bg-red-50 text-red-600 border-red-100', animate: true };
        return { label: 'Ended', color: 'bg-slate-50 text-slate-400 border-slate-100', animate: false };
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#fbfdff]">
                <div className="w-12 h-12 border-[3px] border-red-100 border-t-red-500 rounded-full animate-spin" />
                <p className="mt-4 text-red-400 font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Arena...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfdff] pb-24 overflow-x-hidden selection:bg-red-100 selection:text-red-900">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-red-100 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[35%] h-[35%] bg-orange-50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-red-100">
                            Battleground
                        </div>
                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">
                            <Activity className="w-3 h-3" /> Real-time
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase tracking-wider">
                            Live Arena
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-2xl">
                            Forge your legacy. Compete alongside thousands in high-stakes, real-time assessments.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="sticky top-4 z-40">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar bg-white/40 backdrop-blur-xl p-2 rounded-3xl border border-white/40 shadow-sm w-max max-w-full">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                    ${selectedCategory === category
                                        ? 'bg-red-600 text-white shadow-xl shadow-red-600/20'
                                        : 'bg-white text-slate-400 hover:text-red-500 hover:border-red-100 border border-slate-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {filteredExams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredExams.map((exam, idx) => {
                                const status = getStatus(exam);
                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={exam.id}
                                        className="bg-white border border-red-50/50 rounded-[2.5rem] p-8 hover:border-red-200 hover:shadow-2xl hover:shadow-red-500/5 transition-all duration-500 group relative overflow-hidden flex flex-col h-full"
                                    >
                                        {/* Status Badge */}
                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className="w-16 h-16 bg-red-50/50 rounded-2xl border border-red-100/50 flex items-center justify-center group-hover:bg-red-600 transition-colors duration-500">
                                                <Trophy className="w-8 h-8 text-red-500 group-hover:text-white transition-colors duration-500" />
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                                                {status.animate && <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
                                                {status.label}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-4 flex-1 relative z-10">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.category || 'General Assessment'}</div>
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-red-600 transition-colors">
                                                    {exam.title}
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap gap-4 py-4">
                                                <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                                    <Calendar className="w-3.5 h-3.5 text-red-400" />
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {exam.startTime ? new Date(exam.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBA'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                                                    <span className="text-[10px] font-bold text-slate-500">{exam.duration} Min</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="text-[10px] font-bold text-slate-500">{exam.questionCount || 0} Qs</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 relative z-10 w-full">
                                            {exam.attempts && exam.attempts.count > 0 ? (
                                                <div className="space-y-3 w-full">
                                                    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 shadow-sm shadow-red-500/5">
                                                        <Trophy className="w-3.5 h-3.5" /> Participation Recorded
                                                    </div>
                                                    <Link
                                                        href={`/dashboard/results/${exam.attempts.latestAttemptId}`}
                                                        className="w-full py-3 bg-slate-900 hover:bg-red-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-colors text-[10px] uppercase tracking-[0.2em]"
                                                    >
                                                        <Activity className="w-4 h-4 fill-current" /> View Analysis
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={`/dashboard/exams/${exam.id}`}
                                                    className="w-full py-5 bg-slate-900 hover:bg-red-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10 group-hover:shadow-red-600/20 text-[10px] uppercase tracking-[0.2em]"
                                                >
                                                    <Zap className="w-4 h-4 fill-current" /> Participate Now
                                                </Link>
                                            )}
                                        </div>

                                        {/* Decorative Background Elements */}
                                        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <PremiumEmptyState
                        icon={Trophy}
                        title="Arena Closed"
                        description="The battleground is currently silent. Check back soon for scheduled high-stakes competitions and global tournaments."
                        colorScheme="red"
                        actionLabel="View Past Results"
                        onAction={() => window.location.href = '/dashboard/results'}
                    />
                )}

            </div>
        </div >
    );
}

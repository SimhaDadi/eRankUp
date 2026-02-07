'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Calendar,
    Search,
    ChevronDown,
    Loader2,
    BookOpen,
    HelpCircle,
    Sparkles,
    Activity,
    Zap,
    History,
    FileCheck,
    Star
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Exam {
    id: string;
    title: string;
    description: string;
    type: string;
    category?: string;
    createdAt: string;
    questionCount?: number;
    duration?: number;
    isPublished?: boolean;
    attempts?: {
        count: number;
        latestAttemptId: string;
    };
}

export default function PreviousYearPapersPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';


    const fetchExams = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/exams?type=previous_year_paper');
            const data = response.data;
            const allExams = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            const pypExams = allExams.filter((e: Exam) => e.type === 'previous_year_paper' && e.isPublished);
            setExams(pypExams);
        } catch (error: any) {
            console.error("Failed to fetch PYP exams", error);
            if (error.response?.status === 401) {
                setError("Session expired. Please login again.");
            } else if (error.message === 'Network Error') {
                setError("Unable to connect to server. Check your internet.");
            } else {
                setError("Failed to load papers. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const categories = ['All', ...Array.from(new Set(exams.map(e => e.category || 'Uncategorized')))];

    const filteredExams = exams.filter(exam => {
        const matchesCategory = selectedCategory === 'All' || (exam.category || 'Uncategorized') === selectedCategory;
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#fbfdff]">
                <div className="w-12 h-12 border-[3px] border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                <p className="mt-4 text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">Retrieving Archives...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center text-center max-w-md">
                    <Activity className="w-12 h-12 text-red-500 mb-4" />
                    <h3 className="text-xl font-black text-slate-900 mb-2">Connection Error</h3>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => fetchExams()}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm uppercase tracking-wide"
                    >
                        <History className="w-4 h-4" /> Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-12 space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-blue-100 shadow-sm shadow-blue-500/10">
                            Hall of Fame
                        </div>
                        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-indigo-100 shadow-sm shadow-indigo-500/10 flex items-center gap-2">
                            <History className="w-3 h-3" /> Historical
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter leading-none">
                            <span className="text-gradient-ultra">PREVIOUS</span> <span className="text-gradient-accent">PAPERS</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-2xl">
                            Master the architecture of past successes. <span className="text-slate-900 font-bold decoration-blue-500/30 underline underline-offset-4 decoration-2">Authentic examination papers.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Box */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-1 relative overflow-hidden ring-1 ring-slate-900/5">
                {/* Filters - Sticky within the box */}
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-50 p-3 rounded-t-[2rem]">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                    ${selectedCategory === category
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredExams.map((exam, idx) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                                    key={exam.id}
                                    className="ultra-card group flex flex-col h-full bg-slate-50/50 hover:bg-white"
                                >
                                    <div className="p-6 flex-1 flex flex-col relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-md shadow-slate-200/50 group-hover:scale-110 transition-transform duration-500">
                                                <FileCheck className="w-7 h-7 text-blue-600" strokeWidth={2} />
                                            </div>
                                            <div className="px-3 py-1 bg-white rounded-lg border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
                                                {new Date(exam.createdAt).getFullYear()}
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-5 flex-1">
                                            <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                                                {exam.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {exam.category || 'Official'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <HelpCircle className="w-3 h-3" /> {exam.questionCount || 0} Qs
                                                </span>
                                            </div>
                                        </div>

                                        {exam.attempts && exam.attempts.count > 0 ? (
                                            <div className="space-y-3 w-full">
                                                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm shadow-emerald-500/5">
                                                    <FileCheck className="w-3.5 h-3.5" /> Attempted
                                                </div>
                                                <Link
                                                    href={`/dashboard/results/${exam.attempts.latestAttemptId}`}
                                                    className="w-full btn-ultra-primary justify-center text-xs tracking-[0.15em] bg-slate-900 group-hover:shadow-blue-900/20"
                                                >
                                                    <Activity className="w-4 h-4 text-emerald-400" /> View Analysis
                                                </Link>
                                            </div>
                                        ) : (
                                            <Link
                                                href={`/dashboard/exam-start/${exam.id}`}
                                                className="w-full btn-ultra-primary justify-center text-xs tracking-[0.15em] group-hover:shadow-blue-900/20"
                                            >
                                                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" /> Attempt Now
                                            </Link>
                                        )}
                                    </div>

                                    {/* Card Decor */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 rounded-bl-[3rem] -mr-8 -mt-8 transition-all duration-500 group-hover:scale-150" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredExams.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                <Search className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No Papers Found</h3>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                                Our archives for this category are currently being indexed.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

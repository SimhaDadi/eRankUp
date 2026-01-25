'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    HelpCircle,
    ChevronDown,
    Loader2,
    Layers,
    Target,
    Sparkles,
    Zap,
    Shield,
    Trophy,
    Activity,
    Clock
} from 'lucide-react';

import api from '@/lib/api';
import Link from 'next/link';

interface Exam {
    id: string;
    title: string;
    description: string;
    type: string;
    category?: string;
    createdAt: string;
    questionCount?: number;
    duration?: number;
}

export default function TestSeriesPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await api.get('/exams?type=real_exam');
                const testSeries = Array.isArray(response.data)
                    ? response.data.filter((e: Exam) => e.type === 'real_exam')
                    : [];
                setExams(testSeries);
            } catch (error) {
                console.error("Failed to fetch Test Series", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExams();
    }, []);

    const categories = ['All', ...Array.from(new Set(exams.map(e => e.category || 'Uncategorized')))];

    const filteredExams = exams.filter(exam => {
        return selectedCategory === 'All' || (exam.category || 'Uncategorized') === selectedCategory;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#fbfdff]">
                <div className="w-12 h-12 border-[3px] border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                <p className="mt-4 text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]">Preparing Assessments...</p>
            </div>
        );
    }

    return (
        <div className="pb-24 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-indigo-100 shadow-sm shadow-indigo-500/10">
                            Simulation Mode
                        </div>
                        <div className="px-4 py-1.5 bg-purple-50 text-purple-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-purple-100 shadow-sm shadow-purple-500/10 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Full Length
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black tracking-tighter leading-none">
                            <span className="text-gradient-ultra">TEST</span> <span className="text-gradient-accent">SERIES</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-2xl">
                            The ultimate proving ground. <span className="text-slate-900 font-bold decoration-indigo-500/30 underline underline-offset-4 decoration-2">Elite mock assessments.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Box */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-2 relative overflow-hidden ring-1 ring-slate-900/5">
                {/* Filters - Sticky within the box */}
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-50 p-4 rounded-t-[2rem]">
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
                <div className="p-6 md:p-8">
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
                                    <div className="p-8 flex-1 flex flex-col relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-md shadow-slate-200/50 group-hover:scale-110 transition-transform duration-500">
                                                <Layers className="w-7 h-7 text-indigo-600" strokeWidth={2} />
                                            </div>
                                            <div className="px-3 py-1 bg-white rounded-lg border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
                                                Full Mock
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8 flex-1">
                                            <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                {exam.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {new Date(exam.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {exam.duration || 180}m
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <HelpCircle className="w-3 h-3" /> {exam.questionCount || 0} Qs
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/dashboard/exams/${exam.id}`}
                                            className="w-full btn-ultra-primary justify-center text-xs tracking-[0.15em] group-hover:shadow-indigo-900/20"
                                        >
                                            <Zap className="w-4 h-4 text-purple-400 fill-purple-400" /> Start Test
                                        </Link>
                                    </div>

                                    {/* Card Decor */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-[3rem] -mr-8 -mt-8 transition-all duration-500 group-hover:scale-150" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredExams.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                <Target className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No Series Found</h3>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                                Our academic board is currently finalizing new full-length mock examinations.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

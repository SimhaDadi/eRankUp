'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Clock,
    HelpCircle,
    Calendar,
    ChevronDown,
    Loader2,
    BookOpen,
    Sparkles,
    Trophy,
    Activity,
    Brain,
    Flame
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
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
}

export default function FreeQuizzesPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                // Fetch quizzes - assuming type 'quiz' in backend
                const response = await api.get('/exams?type=quiz');
                const quizzes = Array.isArray(response.data)
                    ? response.data.filter((e: Exam) => e.type === 'quiz')
                    : [];
                setExams(quizzes);
            } catch (error) {
                console.error("Failed to fetch quizzes", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const categories = ['All', ...Array.from(new Set(exams.map(e => e.category || 'Uncategorized')))];

    const filteredQuizzes = exams.filter(quiz => {
        return selectedCategory === 'All' || (quiz.category || 'Uncategorized') === selectedCategory;
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#fbfdff]">
                <div className="w-12 h-12 border-[3px] border-amber-100 border-t-amber-500 rounded-full animate-spin" />
                <p className="mt-4 text-amber-500/70 font-black uppercase tracking-[0.2em] text-[10px]">Charging Memory Banks...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfdff] pb-24 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[35%] h-[35%] bg-orange-50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-amber-100">
                            Knowledge Sprint
                        </div>
                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">
                            <Flame className="w-3 h-3" /> Trending
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase tracking-wider">
                            Free Quizzes
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-2xl">
                            Sharpen your instincts. Rapid-fire quizzes designed for daily mastery and conceptual depth.
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
                                        ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20'
                                        : 'bg-white text-slate-400 hover:text-amber-500 hover:border-amber-100 border border-slate-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {filteredQuizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredQuizzes.map((quiz, idx) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={quiz.id}
                                    className="bg-white border border-amber-50/50 rounded-[2.5rem] p-8 hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 group relative overflow-hidden flex flex-col h-full"
                                >
                                    {/* Icon */}
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="w-16 h-16 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex items-center justify-center group-hover:bg-amber-500 transition-colors duration-500">
                                            <Brain className="w-8 h-8 text-amber-500 group-hover:text-white transition-colors duration-500" />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-100 bg-amber-50 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                            Daily Quiz
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-4 flex-1 relative z-10">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quiz.category || 'General Knowledge'}</div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-amber-600 transition-colors">
                                                {quiz.title}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap gap-4 py-4">
                                            <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    {new Date(quiz.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                                <Clock className="w-3.5 h-3.5 text-orange-400" />
                                                <span className="text-[10px] font-bold text-slate-500">{quiz.duration || 15} Min</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="text-[10px] font-bold text-slate-500">{quiz.questionCount || 10} Qs</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 relative z-10">
                                        <Link
                                            href={`/dashboard/exams/${quiz.id}`}
                                            className="w-full py-5 bg-slate-900 hover:bg-amber-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10 group-hover:shadow-amber-500/20 text-[10px] uppercase tracking-[0.2em]"
                                        >
                                            <Zap className="w-4 h-4 fill-current" /> Start Sprint
                                        </Link>
                                    </div>

                                    {/* Decor */}
                                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <PremiumEmptyState
                        icon={Activity}
                        title="No Quizzes Active"
                        description="New knowledge sprints are being curated by our experts. Return soon to test your limits against the clock."
                        colorScheme="amber"
                        actionLabel="Explore Study Material"
                        onAction={() => window.location.href = '/dashboard/pyp'}
                    />
                )}

            </div>
        </div>
    );
}

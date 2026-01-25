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

export default function PreviousYearPapersPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');


    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await api.get('/exams?type=previous_year_paper');
                const pypExams = Array.isArray(response.data)
                    ? response.data.filter((e: Exam) => e.type === 'previous_year_paper')
                    : [];
                setExams(pypExams);
            } catch (error) {
                console.error("Failed to fetch PYP exams", error);
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
                <div className="w-12 h-12 border-[3px] border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                <p className="mt-4 text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">Retrieving Archives...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfdff] pb-24 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-blue-100 rounded-full blur-[120px]" />
                <div className="absolute bottom-[0%] right-[-5%] w-[35%] h-[35%] bg-indigo-50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                            Hall of Fame
                        </div>
                        <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                            <History className="w-3 h-3" /> Historical
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase tracking-wider">
                            Previous Papers
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-2xl">
                            Master the architecture of past successes. Practice with authentic, curated examination papers from previous years.
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
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                        : 'bg-white text-slate-400 hover:text-blue-500 hover:border-blue-100 border border-slate-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredExams.map((exam, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                key={exam.id}
                                className="bg-white border border-blue-50/50 rounded-[2.5rem] p-8 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group relative overflow-hidden flex flex-col h-full"
                            >
                                {/* Paper Badge */}
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="w-16 h-16 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500">
                                        <FileCheck className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors duration-500" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-100 bg-blue-50 text-[9px] font-black uppercase tracking-widest text-blue-600">
                                        <Star className="w-3 h-3 fill-current" /> {new Date(exam.createdAt).getFullYear()}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-4 flex-1 relative z-10">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.category || 'Official Document'}</div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                                            {exam.title}
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap gap-4 py-4">
                                        <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-[10px] font-bold text-slate-500">
                                                Added {new Date(exam.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-[10px] font-bold text-slate-500">{exam.questionCount || 0} Qs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 relative z-10">
                                    <Link
                                        href={`/dashboard/exams/${exam.id}`}
                                        className="w-full py-5 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-900/10 group-hover:shadow-blue-600/20 text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        <Zap className="w-4 h-4 fill-current" /> Attempt Paper
                                    </Link>
                                </div>

                                {/* Decorative Background Elements */}
                                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredExams.length === 0 && (
                    <div className="py-24 text-center bg-white border border-blue-50 rounded-[3rem] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-full opacity-50" />
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-white border border-blue-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                                <BookOpen className="w-10 h-10 text-blue-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2 uppercase tracking-wider">No Papers Found</h3>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto">Our archives for this category are currently being indexed. Explore other domains in the meantime.</p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

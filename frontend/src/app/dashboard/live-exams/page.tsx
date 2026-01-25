'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layout,
    Calendar,
    Clock,
    Search,
    ChevronRight,
    Loader2,
    BookOpen,
    HelpCircle,
    PlayCircle
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

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
}

export default function LiveExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Helper to determine status
    const getStatus = (exam: Exam) => {
        const now = new Date();
        const start = exam.startTime ? new Date(exam.startTime) : null;
        const end = exam.endTime ? new Date(exam.endTime) : null;

        if (!start || !end) return { label: 'Live', color: 'bg-red-500', animate: true }; // Default to live if no dates

        if (now < start) return { label: 'Upcoming', color: 'bg-amber-500', animate: false };
        if (now >= start && now <= end) return { label: 'Live Now', color: 'bg-red-500', animate: true };
        return { label: 'Ended', color: 'bg-slate-500', animate: false };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
                    Live Exams
                </h1>
                <p className="text-slate-400 text-lg">
                    Compete in real-time with thousands of other aspirants.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-md py-4">
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide max-w-full">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === category
                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search exams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder-slate-600"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredExams.map((exam) => {
                        const status = getStatus(exam);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={exam.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-red-500/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Layout className="w-24 h-24 text-red-500 transform rotate-12" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                            <Layout className="w-6 h-6 text-white" />
                                        </div>
                                        <span className={`flex items-center gap-1.5 text-white text-xs font-bold px-2 py-1 rounded ${status.color}`}>
                                            {status.animate && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                                            {status.label}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-red-400 transition-colors">
                                        {exam.title}
                                    </h3>

                                    <div className="text-sm text-slate-500 mb-6 font-medium bg-slate-800/50 inline-block px-3 py-1 rounded-full">
                                        {exam.category || 'General'}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                            <Calendar className="w-4 h-4 text-red-500" />
                                            <span>
                                                {exam.startTime ? new Date(exam.startTime).toLocaleString() : 'Scheduled Soon'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span>{exam.duration} Minutes</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                            <HelpCircle className="w-4 h-4 text-blue-500" />
                                            <span>{exam.questionCount || 0} Questions</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/dashboard/exams/${exam.id}`}
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        <PlayCircle className="w-5 h-5" /> Participate Now
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredExams.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No active live exams</h3>
                    <p className="text-slate-500">
                        Check back later for scheduled competitions.
                    </p>
                </div>
            )}
        </div>
    );
}

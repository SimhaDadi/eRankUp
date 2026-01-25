'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    HelpCircle,
    Search,
    ChevronRight,
    Loader2,
    Layers,
    Target
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
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                // Fetch default real exams
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

    // Extract unique categories
    const categories = ['All', ...Array.from(new Set(exams.map(e => e.category || 'Uncategorized')))];

    const filteredExams = exams.filter(exam => {
        const matchesCategory = selectedCategory === 'All' || (exam.category || 'Uncategorized') === selectedCategory;
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2">
                    Test Series
                </h1>
                <p className="text-slate-400 text-lg">
                    Comprehensive mock tests designed to simulate the real exam environment.
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
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
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
                        placeholder="Search series..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-600"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredExams.map((exam) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={exam.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Target className="w-24 h-24 text-indigo-500 transform -rotate-12" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded">
                                        Full Mock
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                    {exam.title}
                                </h3>

                                <div className="text-sm text-slate-500 mb-6 font-medium bg-slate-800/50 inline-block px-3 py-1 rounded-full">
                                    {exam.category || 'General'}
                                </div>

                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="w-4 h-4" />
                                        <span>Standard Level</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <HelpCircle className="w-4 h-4" />
                                        <span>{exam.questionCount || 0} Qs</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/dashboard/exams/${exam.id}`}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700 group-hover:border-slate-600"
                                >
                                    <ChevronRight className="w-4 h-4" /> Start Test
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredExams.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Target className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No test series found</h3>
                    <p className="text-slate-500">
                        Try adjusting your search or category filter.
                    </p>
                </div>
            )}
        </div>
    );
}

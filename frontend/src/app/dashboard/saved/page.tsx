'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bookmark,
    Trash2,
    ChevronRight,
    Loader2,
    BookOpen,
    Search,
    ExternalLink
} from 'lucide-react';
import api from '@/lib/api';
import MathRenderer from '@/components/MathRenderer';
import Link from 'next/link';

interface SavedQuestion {
    id: string;
    createdAt: string;
    question: {
        id: string;
        content: string;
        topic: string;
        options: { id: string; text: string }[];
        correctOptionId: string;
        explanation: string;
    };
}

export default function SavedQuestionsPage() {
    const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSavedQuestions = async () => {
        try {
            const res = await api.get('/users/saved-questions');
            setSavedQuestions(res.data);
        } catch (error) {
            console.error("Failed to fetch saved questions", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedQuestions();
    }, []);

    const removeSaved = async (id: string, questionId: string) => {
        try {
            await api.post(`/users/saved-questions/${questionId}/toggle`);
            setSavedQuestions(prev => prev.filter(sq => sq.id !== id));
        } catch (error) {
            console.error("Failed to remove saved question", error);
        }
    };

    const filteredQuestions = savedQuestions.filter(sq =>
        sq.question.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sq.question.topic || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#00bfa5] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Saved Questions</h1>
                    <p className="text-slate-500 font-medium">Questions you've bookmarked for reference.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search bookmarks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00bfa5]/20 focus:border-[#00bfa5] transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredQuestions.map((sq) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={sq.id}
                            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all group relative overflow-hidden ring-1 ring-slate-900/5"
                        >
                            <div className="flex justify-between items-start gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                            {sq.question.topic || 'General'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            Saved on {new Date(sq.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="text-slate-900 font-bold leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                        <MathRenderer content={sq.question.content} />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => removeSaved(sq.id, sq.question.id)}
                                            className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-bold text-xs transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" /> Remove
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                                        <Bookmark className="w-5 h-5 fill-current" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredQuestions.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No questions found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            {searchQuery ? "Try a different search term." : "Bookmark questions from the solution page to see them here."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

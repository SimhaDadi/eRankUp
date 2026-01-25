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
    ExternalLink,
    CheckCircle2,
    Info,
    ChevronDown,
    Zap
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
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#fbfdff]">
                <div className="w-12 h-12 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                <p className="mt-4 text-emerald-600/70 font-black uppercase tracking-[0.2em] text-[10px]">Retrieving Bookmarks...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfdff] pb-24 overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[5%] right-[-5%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[35%] h-[35%] bg-teal-50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-emerald-100 w-max">
                            Library
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase tracking-wider">
                                Saved Questions
                            </h1>
                            <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-lg">
                                Your personal archive of critical concepts and challenging problems.
                            </p>
                        </div>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search concepts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-80 pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {filteredQuestions.map((sq, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                key={sq.id}
                                className="bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 group relative overflow-hidden ring-1 ring-slate-900/5"
                            >
                                <div className="flex justify-between items-start gap-6">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/50">
                                                <Bookmark className="w-5 h-5 text-emerald-600 fill-current" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                                    {sq.question.topic || 'General Knowledge'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                    Saved on {new Date(sq.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-slate-900 font-bold text-lg leading-relaxed">
                                            <MathRenderer content={sq.question.content} />
                                        </div>

                                        <AnimatePresence>
                                            {expandedId === sq.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-6 space-y-6 border-t border-slate-50 mt-6">
                                                        {/* Options Grid */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {sq.question.options?.map((option) => {
                                                                const isCorrect = option.id === sq.question.correctOptionId;
                                                                return (
                                                                    <div
                                                                        key={option.id}
                                                                        className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${isCorrect
                                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                            : 'bg-slate-50 border-slate-100 text-slate-500'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${isCorrect
                                                                            ? 'bg-emerald-500 border-emerald-400 text-white'
                                                                            : 'bg-white border-slate-200 text-slate-400'
                                                                            }`}>
                                                                            {option.id}
                                                                        </div>
                                                                        <div className="text-sm font-bold flex-1">
                                                                            <MathRenderer content={option.text} />
                                                                        </div>
                                                                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Explanation */}
                                                        {sq.question.explanation && (
                                                            <div className="p-6 bg-slate-900 rounded-[1.5rem] space-y-3 relative overflow-hidden group/exp">
                                                                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                                                    <Info className="w-4 h-4" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Mastery Solution</span>
                                                                </div>
                                                                <div className="text-slate-300 text-sm font-medium leading-relaxed">
                                                                    <MathRenderer content={sq.question.explanation} />
                                                                </div>
                                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/exp:opacity-10 transition-opacity">
                                                                    <Zap className="w-24 h-24 text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex items-center gap-4 pt-4">
                                            <button
                                                onClick={() => setExpandedId(expandedId === sq.id ? null : sq.id)}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${expandedId === sq.id
                                                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'
                                                    : 'bg-slate-900 text-white hover:bg-emerald-600'
                                                    }`}
                                            >
                                                {expandedId === sq.id ? 'Hide Solution' : 'View Solution'}
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ${expandedId === sq.id ? 'rotate-180' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => removeSaved(sq.id, sq.question.id)}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Decor */}
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredQuestions.length === 0 && (
                        <div className="py-24 text-center bg-white border border-emerald-50 rounded-[3rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-full opacity-50" />
                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-white border border-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                                    <BookOpen className="w-10 h-10 text-emerald-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2 uppercase tracking-wider">No Bookmarks Found</h3>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto">
                                    {searchQuery ? "No concepts match your search criteria." : "Questions you bookmark from solutions will appear here for future review."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

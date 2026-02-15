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
import { useSearchParams } from 'next/navigation';

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
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
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
        <div className="pb-12 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-3">
                    <div className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-blue-100 w-max shadow-sm shadow-blue-500/10">
                        Library
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tighter leading-none">
                            <span className="text-gradient-ultra">SAVED</span> <span className="text-gradient-accent">QUESTIONS</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-xl">
                            Your personal archive of critical concepts. <span className="text-slate-900 font-bold decoration-blue-500/30 underline underline-offset-4 decoration-2">Master every detail.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Box */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-1 relative overflow-hidden ring-1 ring-slate-900/5">

                {/* Grid */}
                <div className="p-3 md:p-5 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredQuestions.map((sq, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ delay: idx * 0.03, duration: 0.3 }}
                                key={sq.id}
                                className="ultra-card group p-5"
                            >
                                <div className="flex flex-col gap-4 relative z-10">
                                    {/* Compact Meta Header */}
                                    <div className="flex items-center justify-between w-full border-b border-slate-50 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-blue-600 group-hover:shadow-blue-500/20 transition-all duration-300">
                                                <Bookmark className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" strokeWidth={2.5} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-widest leading-none shadow-md shadow-slate-900/10">
                                                        {sq.question.topic || 'General'}
                                                    </span>
                                                    <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                        {new Date(sq.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    ID <span className="font-mono text-slate-500">#{sq.question.id.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Content */}
                                    <div className="text-slate-900 font-bold text-lg leading-relaxed tracking-tight">
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
                                                <div className="pt-6 space-y-6 border-t border-slate-100 mt-2">
                                                    {/* Compact Options Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {sq.question.options?.map((option) => {
                                                            const isCorrect = option.id === sq.question.correctOptionId;
                                                            return (
                                                                <div
                                                                    key={option.id}
                                                                    className={`p-4 rounded-xl border bg-slate-50/30 relative overflow-hidden group/opt transition-all duration-200 flex items-center gap-3 ${isCorrect
                                                                        ? 'border-emerald-500/30 bg-emerald-50/30 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.1)]'
                                                                        : 'border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-white'
                                                                        }`}
                                                                >
                                                                    {isCorrect && <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/40 to-transparent opacity-50" />}
                                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all duration-200 ${isCorrect
                                                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                                                                        : 'bg-white border-slate-200 text-slate-400 group-hover/opt:border-slate-300'
                                                                        }`}>
                                                                        {option.id}
                                                                    </div>
                                                                    <div className={`text-sm font-bold flex-1 leading-snug ${isCorrect ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                        <MathRenderer content={option.text} />
                                                                    </div>
                                                                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={3} />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Compact Explanation */}
                                                    {sq.question.explanation && (
                                                        <div className="p-6 bg-slate-950 rounded-[1.5rem] relative overflow-hidden isolate shadow-lg ring-1 ring-slate-900/5">
                                                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-600 rounded-full blur-[80px] opacity-15 translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
                                                            <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-emerald-500 rounded-full blur-[60px] opacity-10 -translate-x-1/2 translate-y-1/2 mix-blend-screen" />

                                                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                                                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                                                                    <Info className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Mastery Solution</span>
                                                            </div>
                                                            <div className="text-slate-200 text-sm font-medium leading-relaxed relative z-10">
                                                                <MathRenderer content={sq.question.explanation} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Compact Action Bar */}
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hidden md:block">
                                            {new Date(sq.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <button
                                                onClick={() => setExpandedId(expandedId === sq.id ? null : sq.id)}
                                                className={`flex-1 md:flex-none btn-ultra-primary py-2.5 px-5 text-xs rounded-xl shadow-none ${expandedId === sq.id ? 'bg-slate-800' : ''}`}
                                            >
                                                {expandedId === sq.id ? 'Hide' : 'Solution'}
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedId === sq.id ? 'rotate-180' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => removeSaved(sq.id, sq.question.id)}
                                                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredQuestions.length === 0 && (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
                                <BookOpen className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Library Empty</h3>
                            <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                                {searchQuery ? "No matches found." : "Bookmark questions to build your archive."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

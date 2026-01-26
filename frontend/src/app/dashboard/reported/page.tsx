'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    ChevronDown,
    Loader2,
    BookOpen,
    Info,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import api from '@/lib/api';
import MathRenderer from '@/components/MathRenderer';

interface ReportedQuestion {
    id: string;
    createdAt: string;
    type: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    adminNotes: string;
    question: {
        id: string;
        content: string;
        topic: string;
        options: { id: string; text: string }[];
        correctOptionId: string;
        explanation: string;
    };
}

export default function ReportedQuestionsPage() {
    const [reportedQuestions, setReportedQuestions] = useState<ReportedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const fetchReportedQuestions = async () => {
        try {
            const res = await api.get('/quality/my-flags');
            setReportedQuestions(res.data);
        } catch (error) {
            console.error("Failed to fetch reported questions", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReportedQuestions();
    }, []);

    const filteredQuestions = reportedQuestions.filter(rq => {
        const matchesSearch = rq.question.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rq.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || rq.status.toUpperCase() === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'resolved': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle2 };
            case 'dismissed': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: XCircle };
            case 'reviewed': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: Info };
            default: return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Clock };
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#fbfdff]">
                <div className="w-12 h-12 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                <p className="mt-4 text-emerald-600/70 font-black uppercase tracking-[0.2em] text-[10px]">Loading Reports...</p>
            </div>
        );
    }

    return (
        <div className="pb-12 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-3">
                    <div className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-rose-100 w-max shadow-sm shadow-rose-500/10">
                        Content Quality
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tighter leading-none">
                            <span className="text-gradient-ultra">REPORTED</span> <span className="text-gradient-accent">ISSUES</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-xl">
                            Track the status of your reported questions. <span className="text-slate-900 font-bold decoration-rose-500/30 underline underline-offset-4 decoration-2">Help us build perfection.</span>
                        </p>
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.1em] transition-all whitespace-nowrap ${filterStatus === status
                                ? 'bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100 translate-y-[-1px]'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-1 relative overflow-hidden ring-1 ring-slate-900/5">
                <div className="p-3 md:p-5 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredQuestions.map((rq, idx) => {
                            const statusStyles = getStatusStyles(rq.status);
                            const StatusIcon = statusStyles.icon;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                                    key={rq.id}
                                    className="ultra-card group p-5"
                                >
                                    <div className="flex flex-col gap-5 relative z-10">
                                        {/* Meta Header */}
                                        <div className="flex items-center justify-between w-full border-b border-slate-50 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 ${statusStyles.bg} rounded-xl flex items-center justify-center border ${statusStyles.border} shadow-sm transition-all duration-300`}>
                                                    <StatusIcon className={`w-4 h-4 ${statusStyles.text}`} strokeWidth={2.5} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black ${statusStyles.text} px-2 py-0.5 rounded uppercase tracking-widest leading-none ${statusStyles.bg} border ${statusStyles.border}`}>
                                                            {rq.status}
                                                        </span>
                                                        <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                                            {new Date(rq.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400">
                                                        REASON: <span className="text-slate-600 uppercase tracking-tight">{rq.type.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden md:flex flex-col items-end">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Reference</div>
                                                <div className="font-mono text-xs text-slate-500 font-bold">#{rq.question.id.slice(0, 8)}</div>
                                            </div>
                                        </div>

                                        {/* User's Report Detail */}
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MessageSquare className="w-3 h-3 text-slate-400" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Report</span>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                                                "{rq.description}"
                                            </p>
                                        </div>

                                        {/* Admin Notes / Feedback */}
                                        {rq.adminNotes && (
                                            <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/30">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Info className="w-3 h-3 text-blue-500" />
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Admin Feedback</span>
                                                </div>
                                                <p className="text-sm text-slate-700 font-bold leading-relaxed">
                                                    {rq.adminNotes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Question Content */}
                                        <div className="text-slate-900 font-bold text-lg leading-relaxed tracking-tight px-1">
                                            <MathRenderer content={rq.question.content} />
                                        </div>

                                        <AnimatePresence>
                                            {expandedId === rq.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-6 space-y-6 border-t border-slate-100 mt-2">
                                                        {/* Options Grid */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {rq.question.options?.map((option) => {
                                                                const isCorrect = option.id === rq.question.correctOptionId;
                                                                return (
                                                                    <div
                                                                        key={option.id}
                                                                        className={`p-4 rounded-xl border bg-slate-50/30 relative overflow-hidden flex items-center gap-3 ${isCorrect
                                                                            ? 'border-emerald-500/30 bg-emerald-50/30'
                                                                            : 'border-slate-100 text-slate-500'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all duration-200 ${isCorrect
                                                                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                                                                            : 'bg-white border-slate-200 text-slate-400'
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

                                                        {/* Explanation */}
                                                        {rq.question.explanation && (
                                                            <div className="p-6 bg-slate-950 rounded-[1.5rem] relative overflow-hidden isolate shadow-lg">
                                                                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-600 rounded-full blur-[80px] opacity-15 translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
                                                                <div className="flex items-center gap-3 mb-3 relative z-10">
                                                                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                                                                        <Info className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Current Master Solution</span>
                                                                </div>
                                                                <div className="text-slate-200 text-sm font-medium leading-relaxed relative z-10">
                                                                    <MathRenderer content={rq.question.explanation} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Action Bar */}
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                                            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hidden md:block">
                                                REPORT ID: <span className="font-mono">#{rq.id.slice(0, 8)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <button
                                                    onClick={() => setExpandedId(expandedId === rq.id ? null : rq.id)}
                                                    className={`flex-1 md:flex-none btn-ultra-primary py-2.5 px-6 text-xs rounded-xl shadow-none ${expandedId === rq.id ? 'bg-slate-800' : ''}`}
                                                >
                                                    {expandedId === rq.id ? 'Hide Details' : 'View Question'}
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedId === rq.id ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filteredQuestions.length === 0 && (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner">
                                <AlertTriangle className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">No Reports Found</h3>
                            <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                                {searchQuery !== '' || filterStatus !== 'ALL'
                                    ? "No reports match your current filters."
                                    : "You haven't reported any issues yet. Your feedback helps us improve."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

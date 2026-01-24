'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Search,
    Clock,
    Zap,
    Target,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Bookmark,
    Share2,
    Flag,
    Eye,
    EyeOff,
    LayoutDashboard,
    ArrowLeft,
    Sparkles,
    Trophy,
    Info,
    History,
    Lightbulb
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import MathRenderer from '@/components/MathRenderer';
import Link from 'next/link';

interface QuestionResponse {
    id: string;
    selectedOptionId: string;
    isCorrect: boolean;
    timeSpent: number;
    wasSkipped: boolean;
    wasReviewed: boolean;
    question: {
        id: string;
        content: string;
        options: { id: string; text: string }[];
        correctOptionId: string;
        explanation: string;
        topic: string;
    };
}

interface Attempt {
    id: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    responses: QuestionResponse[];
    model?: {
        title: string;
    };
    exam?: {
        title: string;
    };
}

export default function SolutionPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showSolution, setShowSolution] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const res = await api.get(`/exams/attempts/${params.id}`);
                setAttempt(res.data);
            } catch (error) {
                console.error("Failed to fetch attempt", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttempt();
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
                <div className="relative">
                    <div className="w-20 h-20 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!attempt || !attempt.responses.length) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc] p-10 text-center">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center mb-10 border border-slate-100">
                    <LayoutDashboard className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Accessing Neural Cache...</h2>
                <p className="text-slate-500 mt-4 max-sm font-medium leading-relaxed">The solution stream is currently unavailable.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-12 px-10 py-4 bg-[#0f172a] text-white font-bold rounded-2xl shadow-2xl shadow-[#0f172a]/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                    Return to Mission Control
                </button>
            </div>
        );
    }


    const currentResp = attempt.responses[currentIdx];
    const { question } = currentResp;

    const navigateTo = (idx: number) => {
        if (idx >= 0 && idx < attempt.responses.length) {
            setCurrentIdx(idx);
            setShowSolution(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            {/* ... (backgrounds) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[140px]" />
            </div>

            {/* Premium Header with Gradient Lining */}
            <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-transparent relative flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-60" />

                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200/80 shadow-sm group">
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-all" />
                    </button>
                    <div>
                        <h1 className="text-slate-900 font-extrabold text-base tracking-tight truncate max-w-[200px] md:max-w-none">
                            {attempt.model?.title || attempt.exam?.title || 'Assessment Solution'}
                        </h1>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-8">
                    <HeaderMetric label="SCORE" value={`${Math.round(attempt.score)}%`} color="text-indigo-600" />
                    <HeaderMetric label="ACCURACY" value={`${Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)}%`} color="text-emerald-500" />
                    <button onClick={() => router.push(`/dashboard/results/${attempt.id}`)} className="px-5 py-2 bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:scale-105 transition-all">Full Analysis</button>
                </div>
            </header >

            {/* Mobile/Toggle Button for Drawer */}
            <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`fixed right-0 top-32 z-40 bg-white border-l border-t border-b border-slate-200 p-3 rounded-l-2xl shadow-lg transition-transform duration-300 ${isDrawerOpen ? 'translate-x-full' : 'translate-x-0'} lg:hidden`}
            >
                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </button>


            <div className="flex flex-1 overflow-hidden relative z-10 lg:p-4 lg:gap-6 lg:max-w-[1900px] mx-auto w-full">

                {/* Main Content Area - COMPACT & FRAMED */}
                <main className={`flex-1 overflow-y-auto bg-white lg:rounded-[2rem] shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 p-6 lg:p-10 relative group/main transition-all duration-300 ${isDrawerOpen ? 'lg:mr-[380px]' : ''}`}>
                    <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                        {/* Question Header: Number & Meta */}
                        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 font-black text-xl shadow-sm ring-1 ring-slate-900/5">
                                    {currentIdx + 1}
                                </div>
                                <div className="flex items-center gap-3">
                                    {currentResp.isCorrect ? (
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase tracking-widest rounded-lg ring-1 ring-emerald-900/5">Correct</span>
                                    ) : (
                                        <span className="px-3 py-1 bg-red-50 text-red-900 border border-red-200 text-[10px] font-black uppercase tracking-widest rounded-lg ring-1 ring-red-900/5">Incorrect</span>
                                    )}
                                    <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2 border-l border-slate-300">TOPIC: {question.topic || 'General'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 ring-1 ring-slate-900/5">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    <div className="text-slate-900 font-black text-sm">{currentResp.timeSpent}s</div>
                                </div>
                            </div>
                        </div>

                        {/* Question Text - DARKER & CRISP */}
                        <div className="text-lg lg:text-xl text-slate-900 font-bold leading-relaxed tracking-tight py-2">
                            <MathRenderer content={question.content} />
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((opt) => {
                                const isCorrect = opt.id === question.correctOptionId;
                                const isSelected = opt.id === currentResp.selectedOptionId;

                                let status = 'default';
                                if (isCorrect) status = 'correct';
                                else if (isSelected && !isCorrect) status = 'incorrect';

                                return (
                                    <div
                                        key={opt.id}
                                        className={`p-5 rounded-2xl border flex items-start gap-4 transition-all duration-300 ring-1
                                            ${status === 'correct' ? 'bg-emerald-50/60 border-emerald-500 ring-emerald-500/20 shadow-md' :
                                                status === 'incorrect' ? 'bg-red-50/60 border-red-500 ring-red-500/20 shadow-md' :
                                                    'bg-white border-slate-200 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border
                                            ${status === 'correct' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' :
                                                status === 'incorrect' ? 'bg-red-600 text-white border-red-600 shadow-sm' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'}`}
                                        >
                                            {opt.id.toUpperCase()}
                                        </div>
                                        <div className={`font-bold text-sm leading-relaxed ${status === 'correct' ? 'text-emerald-950' : status === 'incorrect' ? 'text-red-950' : 'text-slate-900'}`}>
                                            <MathRenderer content={opt.text} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Solution Section - Toggleable */}
                        <div className="mt-8 pt-8 border-t border-slate-200 transition-all duration-500 ease-in-out">
                            {!showSolution ? (
                                <button
                                    onClick={() => setShowSolution(true)}
                                    className="w-full py-4 bg-white border border-indigo-100 text-indigo-700 font-black text-sm uppercase tracking-widest rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md ring-1 ring-indigo-900/5"
                                >
                                    <Lightbulb className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    View Solution
                                </button>
                            ) : (
                                <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-indigo-900/5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 border-b border-indigo-200/60 pb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-700">
                                                <Lightbulb className="w-4 h-4" />
                                            </div>
                                            <span className="font-black text-indigo-950 text-sm uppercase tracking-wider">Explanation</span>
                                        </div>
                                        <button
                                            onClick={() => setShowSolution(false)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 transition-all"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-slate-900 text-sm leading-relaxed font-medium">
                                        <MathRenderer content={question.explanation || 'No explanation provided.'} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-8 border-t border-slate-200 mt-8">
                            <button
                                disabled={currentIdx === 0}
                                onClick={() => navigateTo(currentIdx - 1)}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 text-sm font-bold text-slate-900 transition-all shadow-sm hover:shadow active:scale-95 ring-1 ring-slate-900/5"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            <span className="text-slate-600 text-xs font-black uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 ring-1 ring-slate-900/5">{currentIdx + 1} / {attempt.responses.length}</span>
                            <button
                                disabled={currentIdx === attempt.responses.length - 1}
                                onClick={() => navigateTo(currentIdx + 1)}
                                className="flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white border border-[#0f172a] rounded-xl hover:bg-slate-800 disabled:opacity-50 text-sm font-bold transition-all shadow-lg hover:translate-y-[-1px] active:scale-95 ring-1 ring-slate-900/20"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar - ALWAYS VISIBLE ON LG & IMPROVED */}
                <aside className={`fixed right-0 top-0 bottom-0 w-[340px] bg-white border-l border-slate-200 shadow-[0_0_40px_-5px_rgb(0,0,0,0.1)] z-50 transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:translate-x-0 lg:w-[340px] lg:bg-transparent lg:shadow-none lg:border-none lg:block lg:flex flex-col gap-6`}>
                    <div className="flex-1 bg-white lg:rounded-[2rem] lg:border border-slate-200 p-6 flex flex-col shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5 h-full overflow-hidden divide-y divide-slate-100">

                        <div className="flex items-center justify-between mb-6 lg:hidden">
                            <h3 className="font-bold text-slate-900">Navigator</h3>
                            <button onClick={() => setIsDrawerOpen(false)}><ChevronRight className="w-6 h-6" /></button>
                        </div>

                        <div className="pb-8">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Question Grid</h3>
                            <div className="grid grid-cols-5 gap-3">
                                {attempt.responses.map((resp, idx) => {
                                    const isActive = currentIdx === idx;
                                    return (
                                        <button
                                            key={resp.id}
                                            onClick={() => {
                                                navigateTo(idx);
                                                if (window.innerWidth < 1024) setIsDrawerOpen(false);
                                            }}
                                            className={`aspect-square rounded-xl font-black text-sm flex items-center justify-center border transition-all duration-200 ring-1
                                                ${isActive ? 'bg-[#0f172a] text-white border-[#0f172a] ring-slate-900/20 scale-110 shadow-xl' :
                                                    resp.isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-900/5 hover:bg-emerald-100 hover:scale-105' :
                                                        resp.wasSkipped ? 'bg-slate-50 text-slate-500 border-slate-200 ring-slate-900/5 hover:bg-slate-100 hover:scale-105' :
                                                            'bg-red-50 text-red-700 border-red-200 ring-red-900/5 hover:bg-red-100 hover:scale-105'}`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-8 space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 ring-1 ring-slate-900/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Correct</span>
                                    <span className="text-emerald-700 font-bold text-sm">{attempt.correctAnswers}</span>
                                </div>
                                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(attempt.correctAnswers / attempt.totalQuestions) * 100}%` }} />
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 ring-1 ring-slate-900/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Accuracy</span>
                                    <span className="text-indigo-700 font-bold text-sm">{Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(attempt.correctAnswers / attempt.totalQuestions) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function HeaderMetric({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex flex-col items-center group/metric">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 group-hover/metric:text-slate-900 transition-colors">{label}</span>
            <span className={`font - black text - xl tracking - tighter transition - transform group - hover / metric:scale-110 ${color}`}>{value}</span>
        </div>
    );
}

function MetricBlock({ icon: Icon, label, value, color = "text-slate-900" }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm relative overflow-hidden group/m">
                <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover/m:opacity-100 transition-opacity" />
                <Icon className="w-5 h-5 relative z-10" />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">{label}</span>
                <span className={`text-base font-black tracking-tight ${color}`}>{value}</span>
            </div>
        </div>
    );
}

function AnalyticsStat({ icon: Icon, color, bg, border, label, value }: any) {
    return (
        <div className={`p-6 rounded-[2rem] ${bg} ${border} flex flex-col items-center gap-3 border transition-all duration-500 hover:scale-110 hover:-rotate-2 group shadow-sm hover:shadow-md relative overflow-hidden`}>
            <div className={`absolute top-0 left-1/4 right-1/4 h-[0.5px] bg-gradient-to-r from-transparent via-indigo-600/10 to-transparent group-hover:via-indigo-600/30 transition-all`} />
            <Icon className={`w-6 h-6 ${color} transition-transform group-hover:rotate-12`} />
            <div className="text-center relative z-10">
                <div className="text-slate-900 font-black text-lg tracking-tight leading-none">{value}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">{label}</div>
            </div>
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-3.5 group/legend">
            <div className={`w-4 h-4 rounded-lg ${color} transition-transform group-hover/legend:scale-125`} />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover/legend:text-slate-900 transition-colors">{label}</span>
        </div>
    );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: any; label: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-3 group/deck relative"
        >
            <div className="w-16 h-16 bg-white rounded-[1.75rem] border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover/deck:text-slate-900 group-hover/deck:border-slate-900 group-hover/deck:shadow-xl transition-all active:scale-95 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover/deck:opacity-100 transition-opacity" />
                <Icon className="w-6 h-6 relative z-10" />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] opacity-0 group-hover/deck:opacity-100 group-hover/deck:text-slate-900 transition-all -translate-y-2 group-hover/deck:translate-y-0">{label}</span>
        </button>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
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
            {/* Soft Ambient Accents */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[140px]" />
            </div>

            {/* Premium Header with Gradient Lining */}
            <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-transparent relative flex items-center justify-between px-8 sticky top-0 z-30">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-60" />
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-30" />

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-11 h-11 flex items-center justify-center bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-200/80 shadow-sm group"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-slate-900 font-extrabold text-lg tracking-tight truncate max-w-[200px] md:max-w-none">
                                {attempt.model?.title || attempt.exam?.title || 'Assessment Solution'}
                            </h1>
                            <div className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 uppercase tracking-widest">Quantum Engine</div>
                        </div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Automated Intelligence Solution</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-12">
                    <HeaderMetric label="SCORE" value={`${Math.round(attempt.score)}%`} color="text-indigo-600" />
                    <HeaderMetric label="ACCURACY" value={`${Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)}%`} color="text-emerald-500" />
                    <HeaderMetric label="LATENCY" value={`${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s`} color="text-amber-500" />

                    <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

                    <button
                        onClick={() => router.push(`/dashboard/results/${attempt.id}`)}
                        className="relative group px-6 py-2.5 bg-[#0f172a] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm" />
                        Full Analysis
                    </button>
                </div>
            </header >

            <div className="flex flex-1 overflow-hidden relative z-10 lg:p-6 lg:gap-8 lg:max-w-[1900px] mx-auto w-full">
                {/* Main Content: Question & Options */}
                <main className="flex-1 overflow-y-auto bg-white lg:rounded-[3rem] shadow-[0_10px_50px_rgba(15,23,42,0.06)] border border-slate-200/50 p-6 lg:p-14 relative group/main overflow-x-hidden">
                    {/* Styling Linings for Main Card */}
                    <div className="absolute inset-0 border-[0.5px] border-indigo-500/5 rounded-[inherit] pointer-events-none" />
                    <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />

                    <div className="max-w-4xl mx-auto space-y-14 relative z-10">
                        {/* Question Tracker & Stat */}
                        <div className="flex flex-wrap items-center justify-between gap-8 pb-10 border-b border-transparent relative">
                            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-slate-100 via-transparent to-slate-100 opacity-50" />

                            <div className="flex items-center gap-6">
                                <div className="relative group/idx">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-[2rem] opacity-0 group-hover/idx:opacity-20 transition-all blur-md" />
                                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.75rem] flex items-center justify-center text-slate-900 font-black text-2xl shadow-inner relative z-10">
                                        {currentIdx + 1}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <h2 className="text-slate-900 font-black text-3xl tracking-tighter">Instance Solution</h2>
                                    <div className="flex items-center gap-3">
                                        {currentResp.isCorrect ? (
                                            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100/50">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Success
                                            </span>
                                        ) : currentResp.wasSkipped ? (
                                            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200/50">
                                                <Info className="w-3.5 h-3.5 text-slate-400" /> Bypassed
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100/50">
                                                <XCircle className="w-3.5 h-3.5 text-red-400" /> Missed
                                            </span>
                                        )}
                                        <div className="w-1 h-3 bg-slate-200 rounded-full" />
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">TOPIC: <span className="text-slate-900 font-black">{question.topic || 'General'}</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-10 lg:gap-14 bg-slate-50/50 px-8 py-4 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent" />
                                <MetricBlock icon={Clock} label="TIME" value={`${currentResp.timeSpent}s`} />
                                <MetricBlock icon={TrendingUp} label="BENCH" value="45s" />
                                <div className="text-center pl-6 border-l border-slate-200">
                                    <div className={`text-2xl font-black ${currentResp.isCorrect ? 'text-emerald-500' : 'text-red-500'} tracking-tighter`}>
                                        {currentResp.isCorrect ? '+1.0' : '-0.25'}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">DELTA</div>
                                </div>
                            </div>
                        </div>

                        {/* Question Text */}
                        <div className="text-2xl lg:text-4xl text-slate-800 font-bold leading-[1.3] tracking-tight selection:bg-indigo-500 selection:text-white">
                            <MathRenderer content={question.content} />
                        </div>

                        {/* Options Grid with Styled Border Linings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {question.options.map((opt) => {
                                const isCorrect = opt.id === question.correctOptionId;
                                const isSelected = opt.id === currentResp.selectedOptionId;

                                let status = 'default';
                                if (isCorrect) status = 'correct';
                                else if (isSelected && !isCorrect) status = 'incorrect';

                                return (
                                    <motion.div
                                        whileHover={{ y: -6 }}
                                        key={opt.id}
                                        className={`p-8 rounded-[2rem] border-[1.5px] transition-all duration-500 flex items-start gap-6 relative overflow-hidden group/opt
                                            ${status === 'correct' ? 'bg-emerald-50/50 border-emerald-500/40 shadow-xl shadow-emerald-500/5' :
                                                status === 'incorrect' ? 'bg-red-50/50 border-red-500/40 shadow-xl shadow-red-500/5' :
                                                    'bg-white border-slate-100/80 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10'}`}
                                    >
                                        {/* Status Specific Styled Linings */}
                                        {status === 'correct' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-60" />}
                                        {status === 'incorrect' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-400 to-red-600 opacity-60" />}

                                        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-base font-black shrink-0 transition-all duration-500 relative overflow-hidden
                                            ${status === 'correct' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-6 scale-110' :
                                                status === 'incorrect' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 -rotate-6' :
                                                    'bg-slate-50 text-slate-400 group-hover/opt:bg-slate-900 group-hover/opt:text-white group-hover/opt:rotate-[360deg]'}`}
                                        >
                                            {opt.id.toUpperCase()}
                                        </div>
                                        <div className={`font-bold pt-2.5 text-xl transition-colors
                                            ${status === 'correct' ? 'text-emerald-950' :
                                                status === 'incorrect' ? 'text-red-950' :
                                                    'text-slate-700 group-hover/opt:text-slate-900'}`}>
                                            <MathRenderer content={opt.text} />
                                        </div>

                                        {status === 'correct' && (
                                            <div className="absolute -bottom-4 -right-4 text-emerald-500/5 group-hover/opt:scale-125 transition-transform duration-700">
                                                <Trophy className="w-32 h-32" />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Action Control with Stylish Lining */}
                        <div className="pt-12 border-t border-slate-100/50 space-y-10 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-10">
                                <div className="h-[2px] w-60 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-8 bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group/cta shadow-2xl shadow-indigo-500/20">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 via-transparent to-cyan-400/20 opacity-40" />
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 text-indigo-400 shadow-inner">
                                        <Lightbulb className="w-7 h-7 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black text-lg tracking-tight">Access Neural Logic</h4>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Verified AI Synthesis Feed</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSolution(!showSolution)}
                                    className={`group/btn relative px-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] transition-all overflow-hidden active:scale-95 shadow-2xl
                                        ${showSolution ? 'bg-white text-slate-900' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                >
                                    <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 group-hover/btn:via-white/80 transition-all duration-700" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        {showSolution ? <EyeOff className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                        {showSolution ? 'Collapse Core' : 'Reveal Solution'}
                                    </div>
                                </button>
                            </div>

                            <AnimatePresence>
                                {showSolution && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: 40 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-gradient-to-br from-white via-indigo-50/10 to-transparent border-[1.5px] border-indigo-100 rounded-[3rem] p-12 lg:p-16 relative shadow-[inset_0_2px_40px_rgba(79,70,229,0.03)] group/sol">
                                            {/* Stylized Border Accent */}
                                            <div className="absolute top-0 left-16 right-16 h-[2.5px] bg-gradient-to-r from-transparent via-indigo-600/60 to-transparent" />

                                            <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover/sol:opacity-[0.05] transition-opacity duration-1000">
                                                <Zap className="w-80 h-80 text-indigo-900" />
                                            </div>

                                            <div className="flex items-center gap-4 mb-12">
                                                <div className="w-1.5 h-10 bg-indigo-600 rounded-full" />
                                                <span className="font-black uppercase tracking-[0.6em] text-[11px] text-indigo-600">Cognitive Methodology</span>
                                            </div>

                                            <div className="text-slate-800 font-bold text-2xl lg:text-3xl leading-[1.7] whitespace-pre-wrap selection:bg-indigo-600 selection:text-white relative z-10">
                                                <MathRenderer content={question.explanation || 'No data trace found.'} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Console - GLASS RADIANT */}
                        <div className="flex items-center justify-center gap-8 py-16 relative">
                            <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-slate-200/50 to-transparent" />

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                disabled={currentIdx === 0}
                                onClick={() => navigateTo(currentIdx - 1)}
                                className="w-16 h-16 bg-white hover:bg-slate-50 disabled:opacity-20 text-slate-900 rounded-[1.5rem] flex items-center justify-center border border-slate-200 shadow-xl transition-all relative overflow-hidden group/nav"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-indigo-50 to-transparent opacity-0 group-hover/nav:opacity-100 transition-opacity" />
                                <ChevronLeft className="w-8 h-8 relative z-10" />
                            </motion.button>

                            <div className="relative group/counter">
                                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/10 via-cyan-400/10 to-indigo-500/10 rounded-[2rem] blur-xl opacity-0 group-hover/counter:opacity-100 transition-all duration-700" />
                                <div className="bg-[#0f172a] text-white px-12 py-5 rounded-[1.75rem] flex items-center gap-6 shadow-2xl relative z-10 border border-white/5">
                                    <div className="flex flex-col items-center">
                                        <span className="font-black text-2xl leading-none">{currentIdx + 1}</span>
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1.5">ITEM</span>
                                    </div>
                                    <div className="h-10 w-[1px] bg-white/10" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-white/40 font-black text-2xl leading-none">{attempt.responses.length}</span>
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1.5">POOL</span>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                disabled={currentIdx === attempt.responses.length - 1}
                                onClick={() => navigateTo(currentIdx + 1)}
                                className="w-16 h-16 bg-white hover:bg-slate-50 disabled:opacity-20 text-slate-900 rounded-[1.5rem] flex items-center justify-center border border-slate-200 shadow-xl transition-all relative overflow-hidden group/nav"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-indigo-50 to-transparent opacity-0 group-hover/nav:opacity-100 transition-opacity" />
                                <ChevronRight className="w-8 h-8 relative z-10" />
                            </motion.button>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Radiant Utility Bar */}
                <aside className="hidden xl:flex flex-col w-[420px] bg-white lg:rounded-[3rem] border border-slate-200/50 p-10 overflow-y-auto shadow-[0_10px_50px_rgba(15,23,42,0.03)] relative">
                    {/* Stylish Linings for Sidebar */}
                    <div className="absolute top-10 bottom-10 left-0 w-[0.5px] bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent" />

                    {/* Mission Profile with Glow */}
                    <div className="mb-14 relative group/profile">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 rounded-[3rem] blur-2xl opacity-0 group-hover/profile:opacity-100 transition-opacity duration-1000" />
                        <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative z-10 overflow-hidden shadow-inner">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                            <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center text-white font-black text-2xl shadow-2xl relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-400 opacity-20" />
                                {user?.fullName?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div>
                                <div className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2 truncate max-w-[180px]">
                                    {user?.fullName || 'Student'}
                                </div>
                                <div className="flex gap-2">
                                    <div className="bg-indigo-600 text-[9px] font-black text-white px-2.5 py-1 rounded-md tracking-widest uppercase">
                                        {user?.role || 'SCHOLAR'}
                                    </div>
                                    <div className="bg-slate-200 text-[9px] font-black text-slate-600 px-2.5 py-1 rounded-md tracking-widest uppercase">
                                        LEVEL {Math.floor((attempt.score / 10) + 1)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Analytics Grid */}
                    <div className="mb-14 relative">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Real-time Telemetry</h3>
                            <div className="h-[1px] flex-1 ml-6 bg-gradient-to-r from-slate-100 to-transparent" />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <AnalyticsStat
                                icon={Zap}
                                color="text-emerald-500"
                                bg="bg-emerald-50/50"
                                border="border-emerald-100/50"
                                label="SPEED"
                                value={`${(attempt.totalQuestions / (attempt.timeTaken / 60 || 1)).toFixed(1)}/m`}
                            />
                            <AnalyticsStat
                                icon={Clock}
                                color="text-amber-500"
                                bg="bg-amber-50/50"
                                border="border-amber-100/50"
                                label="STATUS"
                                value={attempt.score >= 80 ? 'ELITE' : 'ACTIVE'}
                            />
                            <AnalyticsStat
                                icon={Target}
                                color="text-indigo-600"
                                bg="bg-indigo-50/50"
                                border="border-indigo-100/50"
                                label="ACCY"
                                value={`${Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)}%`}
                            />
                            <AnalyticsStat
                                icon={AlertCircle}
                                color={attempt.totalQuestions - attempt.correctAnswers > 0 ? "text-red-400" : "text-emerald-400"}
                                bg={attempt.totalQuestions - attempt.correctAnswers > 0 ? "bg-red-50/50" : "bg-emerald-50/50"}
                                border={attempt.totalQuestions - attempt.correctAnswers > 0 ? "border-red-100/50" : "border-emerald-100/50"}
                                label="MISSED"
                                value={(attempt.totalQuestions - attempt.correctAnswers).toString().padStart(2, '0')}
                            />
                        </div>
                    </div>

                    {/* Question Navigator Grid */}
                    <div className="flex flex-col flex-1 relative">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Grid Overview</h3>
                            <div className="h-[1px] flex-1 ml-6 bg-gradient-to-r from-slate-100 to-transparent" />
                        </div>

                        <div className="grid grid-cols-5 gap-4">
                            {attempt.responses.map((resp, idx) => {
                                const isActive = currentIdx === idx;
                                const isCorrect = resp.isCorrect;
                                const isSkipped = resp.wasSkipped;

                                return (
                                    <motion.button
                                        whileHover={{ y: -4, scale: 1.1, rotate: (idx % 2 === 0 ? 3 : -3) }}
                                        whileTap={{ scale: 0.95 }}
                                        key={resp.id}
                                        onClick={() => navigateTo(idx)}
                                        className={`aspect-square rounded-[1.25rem] font-black text-sm transition-all duration-300 relative flex items-center justify-center border-2
                                            ${isActive ? 'bg-[#0f172a] border-[#0f172a] text-white shadow-2xl scale-110 z-10' :
                                                isCorrect ? 'bg-white border-emerald-100 text-emerald-600 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10' :
                                                    isSkipped ? 'bg-white border-slate-100 text-slate-300 hover:border-slate-400' :
                                                        'bg-white border-red-100 text-red-600 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10'}`}
                                    >
                                        {idx + 1}
                                        {isActive && (
                                            <div className="absolute inset-x-0 -bottom-1 h-3 flex justify-center">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,1)]" />
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Compact Aesthetic Legend */}
                        <div className="mt-12 flex flex-wrap gap-8 px-2 border-t border-slate-100/50 pt-12 relative">
                            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-slate-100/80 to-transparent" />
                            <LegendItem color="bg-emerald-500 shadow-lg shadow-emerald-500/40" label="Perfect" />
                            <LegendItem color="bg-red-500 shadow-lg shadow-red-500/40" label="Critical" />
                            <LegendItem color="bg-slate-200" label="Neutral" />
                        </div>
                    </div>

                    {/* Deck Hub with Gradient Lining Action */}
                    <div className="mt-14 grid grid-cols-3 gap-5 relative">
                        <ActionButton
                            icon={Bookmark}
                            label="SAVE_LOG"
                            onClick={() => alert('Solution log saved to neural records.')}
                        />
                        <ActionButton
                            icon={Share2}
                            label="DISTRIBUTE"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Secure link copied to clipboard.');
                            }}
                        />
                        <ActionButton
                            icon={Flag}
                            label="ESCALATE"
                            onClick={() => alert('Discrepancy reported to assessment oversight.')}
                        />
                    </div>
                </aside>
            </div>
        </div >
    );
}

function HeaderMetric({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex flex-col items-center group/metric">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 group-hover/metric:text-slate-900 transition-colors">{label}</span>
            <span className={`font-black text-xl tracking-tighter transition-transform group-hover/metric:scale-110 ${color}`}>{value}</span>
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

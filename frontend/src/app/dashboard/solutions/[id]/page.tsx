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
    Lightbulb,
    AlertTriangle
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import MathRenderer from '@/components/MathRenderer';
import Link from 'next/link';
import { prettifyMathText } from '@/utils/textFormatter';
import ReportQuestionModal from '@/components/dashboard/ReportQuestionModal';

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
        avgTopperTime?: number;
        chapter?: {
            id: string;
            title: string;
        };
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
        id: string;
        title: string;
    };
    exam?: {
        id: string;
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
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    // Re-attempt mode
    const [reAttemptMode, setReAttemptMode] = useState(false);
    const [reAttemptSelections, setReAttemptSelections] = useState<Record<string, string>>({});

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

    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!attempt || !attempt.responses[currentIdx]) return;
            try {
                const qId = attempt.responses[currentIdx].question.id;
                const res = await api.get(`/users/saved-questions/${qId}/status`);
                setIsSaved(res.data.saved);
            } catch (e) { }
        };
        checkSavedStatus();
    }, [currentIdx, attempt]);

    const handleToggleSave = async () => {
        if (!attempt || !attempt.responses[currentIdx]) return;
        setIsSaving(true);
        try {
            const qId = attempt.responses[currentIdx].question.id;
            const res = await api.post(`/users/saved-questions/${qId}/toggle`);
            setIsSaved(res.data.saved);
        } catch (error: any) {
            console.error("Failed to toggle save", error);
            const msg = error.response?.data?.message || 'Failed to save question. Please try again.';
            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Solution link copied to clipboard!');
    };

    const handleGenerateAIExplanation = async () => {
        if (!attempt || !attempt.responses[currentIdx]) return;
        setIsGenerating(true);
        try {
            const currentResp = attempt.responses[currentIdx];
            const qId = currentResp.question.id;
            const res = await api.get(`/explanations/${qId}`, {
                params: {
                    userAnswer: currentResp.selectedOptionId,
                    examId: attempt.exam?.id || attempt.model?.id
                }
            });

            if (res.data.explanation) {
                // [FIX] Immutably update the attempt state to trigger React re-render
                setAttempt(prev => {
                    if (!prev) return prev;
                    const newResponses = [...prev.responses];
                    const currentResp = { ...newResponses[currentIdx] };
                    const currentQuestion = { ...currentResp.question };

                    // Inject new content and metadata
                    currentQuestion.explanation = res.data.explanation;
                    (currentQuestion as any).isLogicalMismatch = !!res.data.isLogicalMismatch;

                    currentResp.question = currentQuestion as any;
                    newResponses[currentIdx] = currentResp;

                    return {
                        ...prev,
                        responses: newResponses
                    };
                });

                setShowSolution(true);
            }
        } catch (error: any) {
            console.error("Failed to generate AI explanation", error);
            alert("Failed to generate AI explanation. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

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
    const isLogicMismatch = !!(question as any).isLogicalMismatch;

    const handleToggleSolution = () => {
        const nextState = !showSolution;
        setShowSolution(nextState);

        if (nextState) {
            const content = question.explanation?.trim() || '';
            const isPlaceholder = content.includes('Content Under Review') ||
                content.includes('currently being reviewed');

            const isMissing = !content ||
                content === 'No explanation provided.' ||
                content === 'No explanation provided' ||
                content.includes("It seems like you didn't type anything") ||
                content.length < 5;

            if (isMissing && !isPlaceholder && !isGenerating) {
                handleGenerateAIExplanation();
            }
        }
    };

    const handleReAttemptSelect = (questionId: string, optionId: string) => {
        setReAttemptSelections(prev => ({ ...prev, [questionId]: optionId }));
        // [SYNC] Mobile app keeps solution hidden even after picking, user must click "View Solution"
    };

    const navigateTo = (idx: number) => {
        if (idx >= 0 && idx < attempt.responses.length) {
            setCurrentIdx(idx);
            setShowSolution(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            {/* Backgrounds */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[140px]" />
            </div>

            {/* Premium Header */}
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

            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`fixed right-0 top-32 z-40 bg-white border-l border-t border-b border-slate-200 p-3 rounded-l-2xl shadow-lg transition-transform duration-300 ${isDrawerOpen ? 'translate-x-full' : 'translate-x-0'} lg:hidden`}
            >
                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </button>


            <div className="flex flex-1 overflow-hidden relative z-10 lg:p-4 lg:gap-6 lg:max-w-[1900px] mx-auto w-full">

                {/* Main Content Area */}
                <main className={`flex-1 bg-white lg:rounded-[2rem] shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 relative group/main transition-all duration-300 flex flex-col overflow-hidden ${isDrawerOpen ? 'lg:mr-[380px]' : ''}`}>
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-0 md:pb-0">
                        <div className="max-w-5xl mx-auto space-y-4 md:space-y-5 relative z-10 pb-4 md:pb-5">
                            {/* Question Header */}
                            <div className="flex flex-col gap-4 pb-4 border-b border-slate-200">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-slate-200 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-900 font-black text-lg md:text-xl shadow-sm ring-1 ring-slate-900/5 shrink-0">
                                            {currentIdx + 1}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {currentResp.isCorrect ? (
                                                <span className="px-2 md:px-3 py-0.5 md:py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg ring-1 ring-emerald-900/5">Correct</span>
                                            ) : currentResp.wasSkipped ? (
                                                <span className="px-2 md:px-3 py-0.5 md:py-1 bg-slate-50 text-slate-600 border border-slate-200 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg ring-1 ring-slate-900/5">Skipped</span>
                                            ) : (
                                                <span className="px-2 md:px-3 py-0.5 md:py-1 bg-red-50 text-red-900 border border-red-200 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg ring-1 ring-red-900/5">Incorrect</span>
                                            )}
                                            {reAttemptMode && (
                                                <span className="px-2 md:px-3 py-0.5 md:py-1 bg-teal-50 text-teal-800 border border-teal-200 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg ring-1 ring-teal-900/5 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse inline-block" />
                                                    Re-attempt
                                                </span>
                                            )}
                                            <span className="text-slate-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-2 border-l border-slate-300 truncate max-w-[120px] md:max-w-none">
                                                {(question.topic && question.topic.toLowerCase() !== 'general')
                                                    ? question.topic
                                                    : (question.chapter?.title || 'General')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 md:gap-3">
                                        <button
                                            onClick={handleToggleSave}
                                            disabled={isSaving}
                                            className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl transition-all border shadow-sm group
                                            ${isSaved
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                                    : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600'}`}
                                            title={isSaved ? "Saved" : "Save Question"}
                                        >
                                            <Bookmark
                                                className="w-4 h-4 md:w-5 md:h-5 transition-all group-active:scale-90"
                                                fill={isSaved ? "currentColor" : "none"}
                                            />
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white hover:bg-slate-50 rounded-lg md:rounded-xl transition-all border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm group"
                                            title="Share Question"
                                        >
                                            <Share2 className="w-4 h-4 md:w-5 md:h-5 group-active:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => setIsReportModalOpen(true)}
                                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white hover:bg-slate-50 rounded-lg md:rounded-xl transition-all border border-slate-200 text-slate-400 hover:text-rose-600 shadow-sm group"
                                            title="Report Question"
                                        >
                                            <Flag className="w-4 h-4 md:w-5 md:h-5 group-active:scale-90 transition-all" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="flex-1 sm:flex-initial text-right flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 ring-1 ring-slate-900/5">
                                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
                                        <div className="text-slate-900 font-black text-[10px] md:text-xs uppercase tracking-tight flex flex-col items-start leading-none gap-0.5">
                                            <span className="text-[6px] md:text-[7px] text-slate-400">YOU</span>
                                            {currentResp.timeSpent}s
                                        </div>
                                    </div>
                                    {question.avgTopperTime !== undefined && question.avgTopperTime > 0 && (
                                        <div className="flex-1 sm:flex-initial text-right flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 ring-1 ring-slate-900/5">
                                            <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
                                            <div className="text-emerald-900 font-black text-[10px] md:text-xs uppercase tracking-tight flex flex-col items-start leading-none gap-0.5">
                                                <span className="text-[6px] md:text-[7px] text-emerald-400">TOPPER AVG</span>
                                                {Math.round(question.avgTopperTime)}s
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="text-lg lg:text-xl text-slate-900 font-bold leading-relaxed tracking-tight py-1">
                                <MathRenderer content={question.content} />
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {question.options.map((opt) => {
                                    const isCorrectOpt = opt.id === question.correctOptionId;
                                    const isOriginalSelected = opt.id === currentResp.selectedOptionId;
                                    const reAttemptSelected = reAttemptSelections[question.id];
                                    const hasReAttempted = !!reAttemptSelected;

                                    // Normal (read-only) mode coloring
                                    let status = 'default';
                                    if (!reAttemptMode) {
                                        if (isCorrectOpt) status = 'correct';
                                        else if (isOriginalSelected && !isCorrectOpt) status = 'incorrect';
                                    } else {
                                        // Re-attempt mode: only show colors after user has picked
                                        if (hasReAttempted) {
                                            if (isCorrectOpt) status = 'correct';
                                            else if (opt.id === reAttemptSelected && !isCorrectOpt) status = 'incorrect';
                                        }
                                    }

                                    const isReAttemptPicked = reAttemptMode && opt.id === reAttemptSelected;

                                    return (
                                        <div
                                            key={opt.id}
                                            onClick={() => reAttemptMode && !hasReAttempted ? handleReAttemptSelect(question.id, opt.id) : undefined}
                                            className={`p-4 md:p-5 rounded-2xl border flex items-start gap-4 transition-all duration-300 ring-1 relative
                                            ${status === 'correct'
                                                    ? 'bg-emerald-50/60 border-emerald-500 ring-emerald-500/20 shadow-md'
                                                    : status === 'incorrect'
                                                        ? 'bg-red-50/60 border-red-500 ring-red-500/20 shadow-md'
                                                        : reAttemptMode && !hasReAttempted
                                                            ? 'bg-white border-slate-300 ring-slate-900/5 hover:border-teal-400 hover:bg-teal-50/30 shadow-sm cursor-pointer active:scale-[0.98]'
                                                            : 'bg-white border-slate-200 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm'}`}
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border transition-all
                                            ${status === 'correct'
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                    : status === 'incorrect'
                                                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                                        : reAttemptMode && !hasReAttempted
                                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                                            >
                                                {opt.id.toUpperCase()}
                                            </div>
                                            <div className={`font-bold text-sm leading-relaxed flex-1 ${status === 'correct' ? 'text-emerald-950'
                                                : status === 'incorrect' ? 'text-red-950'
                                                    : 'text-slate-900'}`}
                                            >
                                                <MathRenderer content={opt.text} />
                                                {/* Original answer badge in re-attempt mode */}
                                                {reAttemptMode && hasReAttempted && isOriginalSelected && !currentResp.wasSkipped && (
                                                    <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                                        <History className="w-2.5 h-2.5" /> Your original answer
                                                    </span>
                                                )}
                                            </div>
                                            {/* Checkmark or cross overlay after re-attempt pick */}
                                            {reAttemptMode && hasReAttempted && isReAttemptPicked && (
                                                <div className="absolute top-2 right-2">
                                                    {status === 'correct'
                                                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                        : <XCircle className="w-5 h-5 text-red-500" />}
                                                </div>
                                            )}
                                            {reAttemptMode && hasReAttempted && isCorrectOpt && !isReAttemptPicked && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-70" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Re-attempt mode ON banner */}
                            {reAttemptMode && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-start gap-3 rounded-xl p-4 border ${reAttemptSelections[question.id]
                                        ? reAttemptSelections[question.id] === question.correctOptionId
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : 'bg-red-50 border-red-200 text-red-800'
                                        : 'bg-teal-50/70 border-teal-200 text-teal-900'
                                        }`}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        {reAttemptSelections[question.id]
                                            ? reAttemptSelections[question.id] === question.correctOptionId
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                : <XCircle className="w-4 h-4 text-red-500" />
                                            : <Zap className="w-4 h-4 text-teal-600" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wider mb-0.5">
                                            {reAttemptSelections[question.id]
                                                ? reAttemptSelections[question.id] === question.correctOptionId
                                                    ? 'Correct! Well done.'
                                                    : 'Incorrect — check the highlighted answer.'
                                                : 'Re-attempt mode: ON'}
                                        </p>
                                        <p className="text-xs font-medium opacity-80">
                                            {reAttemptSelections[question.id]
                                                ? 'Click "View Solution" to see the full explanation.'
                                                : 'Now you can re-attempt the question'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Solution Section */}
                            <div className="pt-5 md:pt-6 border-t border-slate-200 transition-all duration-500 ease-in-out">
                                {!showSolution ? (
                                    <button
                                        onClick={handleToggleSolution}
                                        className="w-full py-3 bg-white border border-indigo-100 text-indigo-700 font-black text-sm uppercase tracking-widest rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 group shadow-sm hover:shadow-md ring-1 ring-indigo-900/5"
                                    >
                                        <Lightbulb className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        {showSolution ? 'Hide Solution' : 'View Solution'}
                                    </button>
                                ) : (
                                    <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-indigo-900/5 shadow-sm">
                                        <div className="flex items-center justify-between mb-3 border-b border-indigo-200/60 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-700">
                                                    <Lightbulb className="w-4 h-4" />
                                                </div>
                                                <span className="font-black text-indigo-950 text-sm uppercase tracking-wider">Explanation</span>
                                            </div>
                                            <button
                                                onClick={handleToggleSolution}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 transition-all"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-slate-900 text-sm leading-relaxed font-medium">
                                            {(!question.explanation?.trim() ||
                                                question.explanation.trim() === 'No explanation provided.' ||
                                                question.explanation.trim() === 'No explanation provided' ||
                                                question.explanation.trim().includes("It seems like you didn't type anything") ||
                                                question.explanation.trim().length < 5) ? (
                                                <div className="flex flex-col items-center justify-center py-6 gap-4">
                                                    <div className="bg-indigo-100/50 p-4 rounded-full">
                                                        {isGenerating ? (
                                                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                                        ) : (
                                                            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <p className="text-slate-500 text-center text-sm font-semibold">
                                                        {isGenerating ? "Analyzing question & generating step-by-step solution..." : "AI magic is happening..."}
                                                    </p>
                                                    {isGenerating && (
                                                        <div className="w-48 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-indigo-600"
                                                                initial={{ width: "0%" }}
                                                                animate={{ width: "100%" }}
                                                                transition={{ duration: 15, ease: "linear" }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                isLogicMismatch && user?.role === 'student' ? (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-6 text-amber-800 text-xs md:text-sm">
                                                        <div className="flex items-center gap-2 mb-2 font-bold">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            AI Logic Warning
                                                        </div>
                                                        <p>This explanation is currently being reviewed as the AI solved the question differently than the provided answer key.</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-4">
                                                        {isLogicMismatch && (
                                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-xs font-bold flex items-center gap-2">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                Admin Note: Logic Mismatch Detected
                                                            </div>
                                                        )}
                                                        <MathRenderer content={prettifyMathText(question.explanation)} />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Question counter */}
                            <div className="flex items-center justify-center pt-3 md:pt-4 border-t border-slate-200 opacity-80 mt-1 md:mt-2">
                                <span className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 ring-1 ring-slate-900/5">
                                    {currentIdx + 1} / {attempt.responses.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer pinned to bottom of Main card */}
                    <div className="bg-slate-50/80 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_-6px_rgb(0,0,0,0.05)] z-20">
                        <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3 px-4 md:px-0 py-2 md:py-3 animate-in slide-in-from-bottom-2 duration-300">
                            {/* Previous */}
                            <button
                                disabled={currentIdx === 0}
                                onClick={() => navigateTo(currentIdx - 1)}
                                className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs md:text-sm font-bold text-slate-900 transition-all shadow-sm active:scale-95 ring-1 ring-slate-900/5"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            {/* Re-attempt Toggle */}
                            <button
                                onClick={() => {
                                    setReAttemptMode(prev => {
                                        const next = !prev;
                                        // [SYNC] When entering re-attempt mode, hide solution by default
                                        if (next) setShowSolution(false);
                                        return next;
                                    });
                                    if (reAttemptMode) setReAttemptSelections({});
                                }}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-bold text-xs md:text-sm transition-all duration-200 shadow-sm active:scale-95 select-none ${reAttemptMode
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-teal-200 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50'
                                    }`}
                            >
                                <span>Re-attempt Questions</span>
                                <div className={`relative w-9 h-5 rounded-full border transition-colors duration-200 ${reAttemptMode ? 'bg-white/30 border-white/50' : 'bg-slate-200 border-slate-300'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-all duration-200 ${reAttemptMode ? 'left-[calc(100%-18px)] bg-white' : 'left-0.5 bg-slate-500'}`} />
                                </div>
                            </button>

                            {/* Next */}
                            <button
                                disabled={currentIdx === attempt.responses.length - 1}
                                onClick={() => navigateTo(currentIdx + 1)}
                                className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-[#0f172a] text-white border border-[#0f172a] rounded-xl hover:bg-slate-800 disabled:opacity-40 text-xs md:text-sm font-bold transition-all shadow-lg active:scale-95 ring-1 ring-slate-900/20"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
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

            {/* Report Question Modal */}
            <ReportQuestionModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                questionId={question.id}
                questionContent={question.content}
            />
        </div>
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

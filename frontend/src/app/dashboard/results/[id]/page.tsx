'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Trophy,
    Clock,
    Target,
    AlertCircle,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Zap,
    Eye,
    TrendingUp,
    BarChart2,
    PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import api from '@/lib/api';
import Link from 'next/link';
import TopperComparison from '@/components/dashboard/TopperComparison';
import MathRenderer from '@/components/MathRenderer';
import { PercentileCard } from '@/components/PercentileCard';
import { WeaknessPatterns, MistakePattern } from '@/components/WeaknessPatterns';
import { PercentileChart } from '@/components/PercentileChart';

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
    };
}

interface PercentileData {
    percentile: number;
    rank: number;
    totalStudents: number;
    userScore: number;
    averageScore: number;
    medianScore: number;
    distribution: number[];
    performanceTier: 'top' | 'above_average' | 'average' | 'below_average';
}

interface Attempt {
    id: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    userAnswers: Record<string, string>;
    questionTimings?: Record<string, number>;
    responses?: QuestionResponse[];
    insights?: {
        rank: number;
        totalParticipants: number;
        recommendation: string;
        topicAnalysis: Record<string, { correct: number; total: number; time: number }>;
        strengths: string[];
        weaknesses: string[];
        metrics?: {
            positiveMarksEarned: number;
            negativeMarksIncurred: number;
            netMarks: number;
            totalPossibleMarks: number;
            skippedAnswers: number;
            markedForReview: number;
        };
    };
    percentileData?: PercentileData;
    patterns?: MistakePattern[];
    createdAt: string;
    model?: {
        id: string;
        title: string;
        chapter: {
            title: string;
        };
        exams: {
            title: string;
        }[];
    };
    exam?: {
        id: string;
        title: string;
    };
}

// Generate simulated question-level benchmarking data
// In a real scenario, this would come from the backend based on granular tracking
// Generate aggregated topic-level benchmarking data for this specific test
const generateTopperStats = (attempt: Attempt) => {
    // In a real scenario, we would aggregate actual question tags.
    // Here we simulate topic breakdown based on the attempt data.

    // topics: Algebra, Geometry, Arithmetic, Reasoning
    const topics = ['Algebra', 'Geometry', 'Arithmetic', 'Reasoning'];

    return topics.map(topic => {
        // Simulate user score for this topic based on overall score + random variance
        const variance = Math.floor(Math.random() * 20) - 10; // -10 to +10
        const yourScore = Math.min(100, Math.max(0, Math.round(attempt.score) + variance));

        // Topper is usually 10-15% ahead, capped at 100
        const topperScore = Math.min(100, yourScore + Math.floor(Math.random() * 15) + 5);

        return {
            topic,
            yourScore,
            topperScore
        };
    });
};

export default function ResultsPage() {
    const params = useParams();
    const router = useRouter();
    const [attempt, setAttempt] = useState<Attempt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [activeTab, setActiveTab] = useState<'summary' | 'analytics' | 'review'>('summary');

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let retryCount = 0;
        const MAX_RETRIES = 5;

        const fetchResults = async () => {
            try {
                const [attemptRes, analysisRes, percentileRes, patternsRes] = await Promise.allSettled([
                    api.get(`/exams/attempts/${params.id}`),
                    api.get(`/analytics/attempt/${params.id}`),
                    api.get(`/analytics/percentile/exam/${params.id}`),
                    api.get(`/analytics/patterns`)
                ]);

                if (attemptRes.status === 'fulfilled') {
                    const data = attemptRes.value.data;
                    if (analysisRes.status === 'fulfilled') {
                        data.insights = { ...data.insights, ...analysisRes.value.data };
                    }
                    if (percentileRes.status === 'fulfilled') {
                        data.percentileData = percentileRes.value.data;
                    }
                    if (patternsRes.status === 'fulfilled') {
                        data.patterns = patternsRes.value.data.patterns || [];
                    }
                    setAttempt(data);
                }
                setIsLoading(false);
            } catch (error: any) {
                // Retry on 404 (Not Found) or 500
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    console.log(`Retrying fetch... (${retryCount}/${MAX_RETRIES})`);
                    timeoutId = setTimeout(() => fetchResults(), 2000); // Retry after 2s
                } else {
                    console.error("Failed to fetch test results", error);
                    setIsLoading(false);
                }
            }
        };

        fetchResults();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                    <div className="text-slate-500 font-bold animate-pulse">Calculating Score...</div>
                </div>
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="text-center p-12">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Results Not Found</h2>
                <p className="text-slate-400 mt-2">We couldn't find the results for this test session.</p>
                <Link href="/dashboard/exams" className="mt-6 inline-block bg-blue-600 px-6 py-2 rounded-lg font-bold">
                    Back to Exams
                </Link>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const accuracy = Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100);

    return (
        <div className="max-w-6xl mx-auto pb-12 px-2 md:px-8">
            {/* Header Area */}
            <div className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/exams')}
                        className="text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-2 transition-colors font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to My Exams
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Test Results</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {attempt.model
                            ? `${attempt.model.exams?.[0]?.title} • ${attempt.model.title}`
                            : attempt.exam?.title || 'Practice Exam'
                        }
                    </p>
                </div>

                {/* Primary Actions - Moved to Top */}
                <div className="flex flex-wrap gap-2 md:gap-3">
                    {(attempt.exam as any)?.videoSolutionUrl || (attempt.model as any)?.videoSolutionUrl ? (
                        <button
                            onClick={() => window.open((attempt.exam as any)?.videoSolutionUrl || (attempt.model as any)?.videoSolutionUrl, '_blank')}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 text-xs md:text-base"
                        >
                            <div className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[2px] md:border-t-[3px] border-t-transparent border-l-[4px] md:border-l-[6px] border-l-red-600 border-b-[2px] md:border-b-[3px] border-b-transparent ml-0.5" />
                            </div>
                            Watch Analysis
                        </button>
                    ) : null}
                    <button
                        onClick={() => router.push(`/dashboard/solutions/${params.id}`)}
                        className="bg-[#00bfa5] hover:bg-[#00a690] text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl shadow-lg shadow-[#00bfa5]/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 text-xs md:text-base"
                    >
                        <Eye className="w-4 h-4 md:w-5 md:h-5" /> Solutions
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/exam-start/${attempt.model?.id || attempt.exam?.id || params.id}`)}
                        className="bg-white hover:bg-gray-50 text-slate-900 border border-gray-200 font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 text-xs md:text-base"
                    >
                        Retake
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm w-full md:w-fit mb-8 overflow-x-auto no-scrollbar">
                {[
                    { id: 'summary', label: 'Summary' },
                    { id: 'analytics', label: 'Analytics' },
                    { id: 'review', label: 'Review' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`grow md:grow-0 px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: SUMMARY */}
            {activeTab === 'summary' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* Hero Score Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-8 relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Trophy className="w-48 h-48 text-yellow-500" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                            <div className="text-center md:border-r border-gray-100 flex flex-col items-center justify-center h-full gap-4">
                                <div>
                                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#00bfa5] mb-2 tracking-tighter">
                                        {Math.round(attempt.score)}%
                                    </div>
                                    <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50 px-3 py-1 rounded-full">Overall Score</div>
                                </div>

                                {attempt.insights?.rank && (
                                    <div className="pt-4 md:border-t border-gray-100 w-full md:w-2/3">
                                        <div className="flex items-center justify-center gap-2 text-amber-600 font-bold">
                                            <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                                            <span className="text-xl md:text-2xl">Rank #{attempt.insights.rank}</span>
                                        </div>
                                        <div className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            Out of {attempt.insights.totalParticipants} Participants
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-2 col-span-2 gap-3 md:gap-4">
                                {/* Basic Stats */}
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target className="w-4 h-4 text-emerald-500" />
                                        <span className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Accuracy</span>
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-900">{accuracy}%</div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Time Taken</span>
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-slate-900">{formatTime(attempt.timeTaken)}</div>
                                </div>

                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span className="text-emerald-600 text-[10px] md:text-xs font-bold uppercase tracking-wider">Correct</span>
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-emerald-700">{attempt.correctAnswers} <span className="text-emerald-400 text-sm">/ {attempt.totalQuestions}</span></div>
                                </div>

                                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-red-600 text-[10px] md:text-xs font-bold uppercase tracking-wider">Incorrect</span>
                                    </div>
                                    <div className="text-xl md:text-2xl font-bold text-red-700">
                                        {attempt.totalQuestions - attempt.correctAnswers - (attempt.insights?.metrics?.skippedAnswers || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Complete Profile: Marking Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col gap-1">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Net Marks</span>
                            <div className="text-xl md:text-3xl font-black text-slate-900">
                                {attempt.insights?.metrics?.netMarks ?? 'N/A'}
                                <span className="text-slate-300 text-[10px] md:text-sm font-bold ml-1">/ {attempt.insights?.metrics?.totalPossibleMarks}</span>
                            </div>
                            <p className="hidden md:block text-[10px] text-slate-400 font-medium">Final score after negative</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col gap-1">
                            <span className="text-emerald-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Positive</span>
                            <div className="text-xl md:text-3xl font-black text-emerald-600">+{attempt.insights?.metrics?.positiveMarksEarned ?? 'N/A'}</div>
                            <p className="hidden md:block text-[10px] text-slate-400 font-medium">Earned marks</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col gap-1">
                            <span className="text-red-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Negative</span>
                            <div className="text-xl md:text-3xl font-black text-red-600">-{attempt.insights?.metrics?.negativeMarksIncurred ?? 'N/A'}</div>
                            <p className="hidden md:block text-[10px] text-slate-400 font-medium">Deducted marks</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm flex flex-col gap-1">
                            <span className="text-amber-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Skipped</span>
                            <div className="text-xl md:text-3xl font-black text-amber-600">{attempt.insights?.metrics?.skippedAnswers ?? 0}</div>
                            <p className="hidden md:block text-[10px] text-slate-400 font-medium">Unattempted ({attempt.insights?.metrics?.skippedAnswers || 0})</p>
                        </div>
                    </div>

                    {/* Visual Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Performance Breakdown Pie Chart */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <PieChartIcon className="w-5 h-5 text-blue-500" />
                                    Performance Breakdown
                                </h3>
                                {attempt.insights?.metrics?.markedForReview !== undefined && attempt.insights.metrics.markedForReview > 0 && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{attempt.insights.metrics.markedForReview} Marked for Review</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-64 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Correct', value: attempt.correctAnswers, color: '#10b981' },
                                                { name: 'Incorrect', value: attempt.totalQuestions - attempt.correctAnswers - (attempt.insights?.metrics?.skippedAnswers || 0), color: '#ef4444' },
                                                { name: 'Unattempted', value: attempt.insights?.metrics?.skippedAnswers || 0, color: '#f59e0b' }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {[
                                                { name: 'Correct', color: '#10b981' },
                                                { name: 'Incorrect', color: '#ef4444' },
                                                { name: 'Unattempted', color: '#f59e0b' }
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-slate-900">{attempt.totalQuestions}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Questions</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Topic Mastery Radar Chart */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Topic Mastery
                            </h3>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                        Object.keys(attempt.insights?.topicAnalysis || {}).map(topic => ({
                                            topic: topic.length > 12 ? topic.substring(0, 10) + '..' : topic,
                                            score: Math.round((attempt.insights!.topicAnalysis[topic].correct / attempt.insights!.topicAnalysis[topic].total) * 100)
                                        }))
                                    }>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Your Score"
                                            dataKey="score"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fill="#3b82f6"
                                            fillOpacity={0.3}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">Performance mapped across subjects (%)</p>
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    {attempt.insights ? (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8 flex gap-6 items-start shadow-inner">
                            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-blue-900 mb-2">Performance Insights</h3>
                                <p className="text-blue-800 text-lg leading-relaxed">
                                    {attempt.insights.recommendation}
                                </p>

                                {attempt.insights.strengths.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <span className="text-xs uppercase font-black text-blue-400 tracking-widest py-1">Strengths:</span>
                                        {attempt.insights.strengths.map((s: string) => (
                                            <span key={s} className="bg-white text-emerald-600 font-bold text-xs px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : isAnalyzing ? (
                        <div className="bg-white border border-blue-100 rounded-3xl p-12 text-center shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-50/50 animate-pulse" />
                            <div className="relative z-10">
                                <div className="inline-block p-4 bg-blue-100 rounded-full mb-4 animate-bounce">
                                    <Zap className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing your performance...</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    Our analysis engine is processing your answers, identifying weak spots, and generating personalized recommendations. This usually takes just a few seconds.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-8 flex gap-4 items-center justify-center opacity-60">
                            <div className="text-slate-400 font-medium">No insights generated for this attempt.</div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === 'analytics' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {attempt.insights?.topicAnalysis && Object.keys(attempt.insights.topicAnalysis).length > 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Target className="w-6 h-6 text-blue-600" /> Topic Mastery Analysis
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(attempt.insights.topicAnalysis).map(([topic, stats]) => {
                                    const topicAcc = Math.round((stats.correct / stats.total) * 100);
                                    return (
                                        <div key={topic} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                            <div className="text-sm font-bold text-slate-700 truncate mb-3" title={topic}>{topic}</div>
                                            <div className="flex items-end justify-between mb-2">
                                                <div className="text-xs text-slate-500 font-medium">{stats.correct}/{stats.total} Correct</div>
                                                <div className={`text-2xl font-black ${topicAcc >= 80 ? 'text-emerald-500' :
                                                    topicAcc >= 50 ? 'text-amber-500' : 'text-red-500'
                                                    }`}>
                                                    {topicAcc}%
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${topicAcc >= 80 ? 'bg-emerald-500' :
                                                        topicAcc >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${topicAcc}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {attempt?.percentileData && (
                            <PercentileCard
                                percentile={attempt.percentileData.percentile}
                                rank={attempt.percentileData.rank}
                                totalStudents={attempt.percentileData.totalStudents}
                                userScore={attempt.percentileData.userScore}
                                averageScore={attempt.percentileData.averageScore}
                                medianScore={attempt.percentileData.medianScore}
                                distribution={attempt.percentileData.distribution}
                                performanceTier={attempt.percentileData.performanceTier}
                            />
                        )}

                        {attempt && <TopperComparison stats={generateTopperStats(attempt)} />}
                    </div>

                    {attempt?.percentileData && (
                        <PercentileChart
                            distribution={attempt.percentileData.distribution}
                            userScore={attempt.percentileData.userScore}
                            averageScore={attempt.percentileData.averageScore}
                            medianScore={attempt.percentileData.medianScore}
                        />
                    )}

                    {attempt?.patterns && <WeaknessPatterns patterns={attempt.patterns} />}
                </motion.div>
            )}

            {/* TAB CONTENT: REVIEW */}
            {activeTab === 'review' && attempt.responses && attempt.responses.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-slate-900">Detailed Question Review</h2>
                        </div>
                        <div className="text-sm text-slate-500 font-medium">
                            Showing {attempt.responses.length} responses
                        </div>
                    </div>

                    {Object.entries(
                        attempt.responses.reduce((acc, resp) => {
                            const topic = resp.question.topic || 'General';
                            if (!acc[topic]) acc[topic] = [];
                            acc[topic].push(resp);
                            return acc;
                        }, {} as Record<string, QuestionResponse[]>)
                    ).map(([topic, topicResponses]) => (
                        <div key={topic} className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl sticky top-4 z-10 shadow-sm border border-slate-200">
                                {topic}
                            </h3>

                            <div className="space-y-6">
                                {topicResponses.map((resp, qIdx) => (
                                    <div
                                        key={resp.id}
                                        className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-lg text-xs">
                                                        Q. {attempt.responses?.indexOf(resp)! + 1}
                                                    </span>
                                                    {resp.isCorrect ? (
                                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 shrink-0">
                                                            <CheckCircle2 className="w-3 h-3" /> Correct
                                                        </span>
                                                    ) : resp.wasSkipped ? (
                                                        <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1 shrink-0">
                                                            <AlertCircle className="w-3 h-3" /> Skipped
                                                        </span>
                                                    ) : (
                                                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1 shrink-0">
                                                            <XCircle className="w-3 h-3" /> Incorrect
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" /> TIME: {resp.timeSpent}s
                                                    </div>
                                                    {resp.question.avgTopperTime !== undefined && resp.question.avgTopperTime > 0 && (
                                                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Trophy className="w-3 h-3" /> TOPPER: {Math.round(resp.question.avgTopperTime)}s
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-lg text-slate-800 font-medium mb-8 leading-relaxed">
                                                <MathRenderer content={resp.question.content} />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {resp.question.options.map((option) => {
                                                    const isUserChoice = resp.selectedOptionId === option.id;
                                                    const isCorrect = resp.question.correctOptionId === option.id;

                                                    let variant = "bg-white border-gray-100";
                                                    if (isCorrect) variant = "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500";
                                                    else if (isUserChoice && !isCorrect) variant = "bg-red-50 border-red-500 ring-1 ring-red-500";

                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${variant}`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-xs
                                                                ${isCorrect ? 'bg-emerald-500 text-white' :
                                                                    isUserChoice ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                            >
                                                                {option.id}
                                                            </div>
                                                            <div className="text-sm font-medium pt-0.5">
                                                                <MathRenderer content={option.text} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

        </div>
    );
}

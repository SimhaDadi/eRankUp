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
    Eye
} from 'lucide-react';
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
        topicAnalysis: Record<string, { correct: number; total: number; time: number }>;
        strengths: string[];
        weaknesses: string[];
        recommendation: string;
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
                        data.insights = analysisRes.value.data;
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
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/exams')}
                        className="text-slate-500 hover:text-blue-600 flex items-center gap-2 mb-4 transition-colors font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to My Exams
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">Test Results</h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {attempt.model
                            ? `${attempt.model.exams?.[0]?.title} • ${attempt.model.title}`
                            : attempt.exam?.title || 'Practice Exam'
                        }
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">Completed On</div>
                    <div className="text-sm text-slate-700 font-bold">{new Date(attempt.createdAt).toLocaleDateString()}</div>
                </div>
            </div>

            {/* Hero Score Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-3xl p-8 relative overflow-hidden shadow-xl"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Trophy className="w-48 h-48 text-yellow-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                    <div className="text-center md:border-r border-gray-100 flex flex-col items-center justify-center h-full gap-4">
                        <div>
                            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#00bfa5] mb-2 tracking-tighter">
                                {Math.round(attempt.score)}%
                            </div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs bg-slate-50 px-3 py-1 rounded-full">Overall Score</div>
                        </div>

                        {attempt.insights?.rank && (
                            <div className="pt-4 border-t border-gray-100 w-2/3">
                                <div className="flex items-center justify-center gap-2 text-amber-600 font-bold">
                                    <Trophy className="w-5 h-5" />
                                    <span className="text-2xl">Rank #{attempt.insights.rank}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    Out of {attempt.insights.totalParticipants} Participants
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 col-span-2 gap-4">
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <Target className="w-5 h-5 text-emerald-500" />
                                <span className="text-slate-500 text-sm font-bold">Accuracy</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{accuracy}%</div>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                <span className="text-slate-500 text-sm font-bold">Time Taken</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{formatTime(attempt.timeTaken)}</div>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <span className="text-slate-500 text-sm font-bold">Correct</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{attempt.correctAnswers} <span className="text-slate-400 text-lg">/ {attempt.totalQuestions}</span></div>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <XCircle className="w-5 h-5 text-red-500" />
                                <span className="text-slate-500 text-sm font-bold">Incorrect</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{attempt.totalQuestions - attempt.correctAnswers}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* AI Recommendations */}
            {attempt.insights ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8 flex gap-6 items-start shadow-inner">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-900 mb-2">AI Performance Insights</h3>
                        <p className="text-blue-800 text-lg leading-relaxed">
                            {attempt.insights.recommendation}
                        </p>

                        {attempt.insights.strengths.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                <span className="text-xs uppercase font-black text-blue-400 tracking-widest py-1">Strengths:</span>
                                {attempt.insights.strengths.map(s => (
                                    <span key={s} className="bg-white text-emerald-600 font-bold text-xs px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}

                        {attempt.insights.topicAnalysis && Object.keys(attempt.insights.topicAnalysis).length > 0 && (
                            <div className="mt-8 border-t border-blue-200/50 pt-6">
                                <h4 className="text-xs uppercase font-black text-blue-400 tracking-widest mb-4">Granular Topic Mastery</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(attempt.insights.topicAnalysis).map(([topic, stats]) => {
                                        const topicAcc = Math.round((stats.correct / stats.total) * 100);
                                        return (
                                            <div key={topic} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                                <div className="text-xs font-bold text-slate-700 truncate mb-2" title={topic}>{topic}</div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="text-xs text-slate-400 font-medium">{stats.correct}/{stats.total} Correct</div>
                                                    <div className={`text-sm font-black ${topicAcc >= 80 ? 'text-emerald-500' :
                                                        topicAcc >= 50 ? 'text-amber-500' : 'text-red-500'
                                                        }`}>
                                                        {topicAcc}%
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${topicAcc >= 80 ? 'bg-emerald-500' :
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
                            Our AI engine is processing your answers, identifying weak spots, and generating personalized recommendations. This usually takes just a few seconds.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 border-dashed rounded-3xl p-8 flex gap-4 items-center justify-center opacity-60">
                    <div className="text-slate-400 font-medium">No insights generated for this attempt.</div>
                </div>
            )}
            {/* Topper Comparison Benchmarking */}
            {attempt && (
                <div className="mt-8">
                    <TopperComparison stats={generateTopperStats(attempt)} />
                </div>
            )}

            {/* Percentile Ranking */}
            {attempt?.percentileData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8"
                >
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
                </motion.div>
            )}

            {/* Score Distribution Chart */}
            {attempt?.percentileData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8"
                >
                    <PercentileChart
                        distribution={attempt.percentileData.distribution}
                        userScore={attempt.percentileData.userScore}
                        averageScore={attempt.percentileData.averageScore}
                        medianScore={attempt.percentileData.medianScore}
                    />
                </motion.div>
            )}

            {/* Weakness Patterns */}
            {attempt?.patterns && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8"
                >
                    <WeaknessPatterns patterns={attempt.patterns} />
                </motion.div>
            )}

            {/* Question-wise Detailed Review */}
            {attempt.responses && attempt.responses.length > 0 && (
                <div className="mt-12 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-slate-900">Detailed Question Review</h2>
                    </div>

                    {/* Grouping by Topic (Exam-wise) */}
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
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        key={resp.id}
                                        className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg text-sm">
                                                        Q. {attempt.responses?.indexOf(resp)! + 1}
                                                    </span>
                                                    {resp.isCorrect ? (
                                                        <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Correct
                                                        </span>
                                                    ) : resp.wasSkipped ? (
                                                        <span className="bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Skipped
                                                        </span>
                                                    ) : (
                                                        <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100 flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" /> Incorrect
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    Time Spent: {resp.timeSpent}s
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
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <button
                    onClick={() => router.push(`/dashboard/solutions/${params.id}`)}
                    className="flex-1 bg-[#00bfa5] hover:bg-[#00a690] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#00bfa5]/20 transition-all flex items-center justify-center gap-2"
                >
                    <Eye className="w-5 h-5" /> View Solutions
                </button>
                <button
                    onClick={() => router.push(`/dashboard/test/${params.id}`)}
                    className="flex-1 bg-white hover:bg-gray-50 text-slate-900 border border-gray-200 font-bold py-4 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                    Retake Test
                </button>
                <button
                    onClick={() => router.push('/dashboard/exams')}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/10 transition-all"
                >
                    Choose Another Exam
                </button>
            </div>

        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    TrendingUp,
    Target,
    Zap,
    Award,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    BarChart3,
    Activity
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface MasteryData {
    subjectId: string;
    subjectTitle: string;
    chapterId: string;
    chapterTitle: string;
    masteryScore: number;
    totalAttempts: number;
    correctAttempts: number;
    averageDifficulty: number;
    recommendation: string;
}

interface MasteryReport {
    userId: string;
    overallMastery: number;
    totalAttempts: number;
    totalCorrect: number;
    chapterBreakdown: MasteryData[];
    weakestAreas: MasteryData[];
    strongestAreas: MasteryData[];
}

export default function AIInsightsPage() {
    const { user } = useAuthStore();
    const [masteryReport, setMasteryReport] = useState<MasteryReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'recommendations'>('overview');

    useEffect(() => {
        const fetchMasteryReport = async () => {
            if (!user?.id) return;

            try {
                const response = await api.get(`/ai/mastery-report/${user.id}`);
                setMasteryReport(response.data);
            } catch (error) {
                console.error('Failed to fetch mastery report', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMasteryReport();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-slate-400 font-bold">Analyzing your performance...</p>
                </div>
            </div>
        );
    }

    if (!masteryReport) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800">
                    <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-300 mb-2">No Data Available</h3>
                    <p className="text-slate-500">Complete some tests to see AI-powered insights!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c111d] text-slate-100 p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                            <Brain className="w-8 h-8 text-purple-400" />
                        </div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                            AI Performance Insights
                        </h1>
                    </div>
                    <p className="text-slate-400 font-medium">Personalized analytics powered by machine learning</p>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-3xl border border-cyan-500/20 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Award className="w-8 h-8 text-cyan-400" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{masteryReport.overallMastery}%</div>
                            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Overall Mastery</div>
                        </div>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                            style={{ width: `${masteryReport.overallMastery}%` }}
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-3xl border border-emerald-500/20 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{masteryReport.totalCorrect}</div>
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Correct Answers</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-3xl border border-purple-500/20 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <Activity className="w-8 h-8 text-purple-400" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{masteryReport.totalAttempts}</div>
                            <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Total Attempts</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-3xl border border-amber-500/20 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between">
                        <TrendingUp className="w-8 h-8 text-amber-400" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{Math.round((masteryReport.totalCorrect / masteryReport.totalAttempts) * 100)}%</div>
                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Accuracy</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-800/50 pb-4">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'overview'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Performance Overview
                </button>
                <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'recommendations'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    AI Recommendations
                </button>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Weakest Areas */}
                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2rem] p-8 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertCircle className="w-6 h-6 text-rose-400" />
                            <h3 className="text-xl font-black text-white">Areas Needing Attention</h3>
                        </div>
                        <div className="grid gap-4">
                            {masteryReport.weakestAreas.map((area, idx) => (
                                <motion.div
                                    key={area.chapterId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-rose-500/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                                                {area.chapterTitle}
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                {area.subjectTitle}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-rose-400">{area.masteryScore}%</div>
                                            <div className="text-[10px] font-black text-slate-600 uppercase">Mastery</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-slate-500">{area.totalAttempts} attempts</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                        <span className="text-slate-500">{area.correctAttempts} correct</span>
                                    </div>
                                    <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                        <p className="text-xs text-rose-300 font-medium">{area.recommendation}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Strongest Areas */}
                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2rem] p-8 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="w-6 h-6 text-emerald-400" />
                            <h3 className="text-xl font-black text-white">Your Strengths</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {masteryReport.strongestAreas.map((area, idx) => (
                                <motion.div
                                    key={area.chapterId}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20"
                                >
                                    <div className="text-3xl font-black text-emerald-400 mb-2">{area.masteryScore}%</div>
                                    <div className="text-sm font-bold text-slate-200">{area.chapterTitle}</div>
                                    <div className="text-xs text-slate-500 mt-1">{area.subjectTitle}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'recommendations' && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-[2rem] p-8 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-black text-white">Personalized Study Plan</h3>
                    </div>
                    <div className="space-y-4">
                        {masteryReport.weakestAreas.map((area, idx) => (
                            <div key={area.chapterId} className="flex items-start gap-4 p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                                <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-black">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-200 mb-2">Focus on {area.chapterTitle}</div>
                                    <p className="text-sm text-slate-400 mb-3">{area.recommendation}</p>
                                    <button className="text-xs font-black text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-colors flex items-center gap-2">
                                        Start Practice <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

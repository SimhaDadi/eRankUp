'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Target, Zap, ArrowRight } from 'lucide-react';

interface MacroAIInsightsProps {
    stats: any;
    trendData: any[];
}

export default function MacroAIInsights({ stats, trendData }: MacroAIInsightsProps) {
    if (!stats || trendData.length < 2) return null;

    // --- Heuristic Analysis Logic ---

    // 1. Analyze Trend
    const recentScores = trendData.slice(-3).map(d => d.score);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const previousAvg = trendData.slice(0, -3).reduce((a: number, b: any) => a + b.score, 0) / Math.max(1, trendData.length - 3);

    const isImproving = avgRecent > previousAvg;
    const trendDiff = Math.round(avgRecent - previousAvg);

    // 2. Analyze Balance (Speed vs Accuracy)
    const accuracy = stats.accuracy || 0;
    // Assuming avg time per question is roughly totalTime / totalQuestions / totalAttempts (simplified)
    const avgTimePerTest = stats.totalTimeTaken / (stats.totalAttempts || 1); // in seconds
    const isFast = avgTimePerTest < 1800; // Less than 30 mins per test is "fast" (arbitrary threshold for demo)

    let strategyTitle = "";
    let strategyDesc = "";
    let focusArea = "";

    if (accuracy > 85 && isFast) {
        strategyTitle = "Elite Performance Mode";
        strategyDesc = "You are operating at peak efficiency. Your speed and accuracy are balanced ideally.";
        focusArea = "Maintain consistency & attempt harder mock tests.";
    } else if (accuracy > 85 && !isFast) {
        strategyTitle = "Precision Master";
        strategyDesc = "Your accuracy is excellent, but you are taking too long. You know the concepts well.";
        focusArea = "Focus on time-boxed drills to improve speed.";
    } else if (accuracy < 60 && isFast) {
        strategyTitle = "Speed Demon (Risky)";
        strategyDesc = "You are rushing through questions. Speed is good, but not at the cost of mistakes.";
        focusArea = "Slow down. Review concepts before attempting tests.";
    } else {
        strategyTitle = "Foundational Building";
        strategyDesc = "Your scores are fluctuating. This often happens when learning new concepts.";
        focusArea = "Focus on topic-wise practice rather than full mocks.";
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl text-white mb-8"
        >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                            <Sparkles className="w-6 h-6 text-indigo-300" />
                        </div>
                        <span className="text-indigo-200 font-bold uppercase tracking-widest text-xs">AI Strategic Overview</span>
                    </div>

                    <h2 className="text-3xl font-black tracking-tight">{strategyTitle}</h2>
                    <p className="text-indigo-100/80 text-lg leading-relaxed max-w-2xl">
                        {strategyDesc}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
                            {isImproving ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-amber-400" />}
                            <div>
                                <div className="text-[10px] uppercase font-bold text-white/50">Recent Trend</div>
                                <div className="font-bold text-sm">{isImproving ? 'Improving' : 'Stabilizing'} ({trendDiff > 0 ? '+' : ''}{trendDiff}%)</div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
                            <Target className="w-5 h-5 text-blue-400" />
                            <div>
                                <div className="text-[10px] uppercase font-bold text-white/50">Rec. Focus</div>
                                <div className="font-bold text-sm">{accuracy > 80 ? 'Speed Drills' : 'Concept Clarity'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Next Best Action
                    </h3>
                    <p className="font-medium text-white mb-6">
                        "{focusArea}"
                    </p>
                    <button className="w-full py-3 bg-[#00bfa5] hover:bg-[#00bfa5]/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#00bfa5]/20 flex items-center justify-center gap-2 group">
                        Generate Personal Plan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Target, Zap, ArrowRight, X, CheckCircle2, BookOpen, Clock, BarChart2, Brain, Trophy } from 'lucide-react';

interface MacroAIInsightsProps {
    stats: any;
    trendData: any[];
}

export default function MacroAIInsights({ stats, trendData }: MacroAIInsightsProps) {
    const [showPlan, setShowPlan] = useState(false);

    if (!stats || trendData.length < 2) return null;

    // --- Heuristic Analysis Logic ---
    const recentScores = trendData.slice(-3).map(d => d.score);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const previousAvg = trendData.slice(0, -3).reduce((a: number, b: any) => a + b.score, 0) / Math.max(1, trendData.length - 3);

    const isImproving = avgRecent > previousAvg;
    const trendDiff = Math.round(avgRecent - previousAvg);

    const accuracy = stats.accuracy || 0;
    const avgTimePerTest = stats.totalTimeTaken / (stats.totalAttempts || 1); // in seconds
    // FIX: threshold raised to 3600s (60 mins) — a realistic exam duration
    const isFast = avgTimePerTest < 3600;

    let strategyTitle = "";
    let strategyDesc = "";
    let focusArea = "";
    // CTA route adapts to the user's profile
    let ctaRoute = "/dashboard/practice";

    if (accuracy > 85 && isFast) {
        strategyTitle = "Elite Performance Mode";
        strategyDesc = "You are operating at peak efficiency. Your speed and accuracy are balanced ideally.";
        focusArea = "Maintain consistency & attempt harder mock tests.";
        ctaRoute = "/dashboard/pyp"; // Elite → previous year papers
    } else if (accuracy > 85 && !isFast) {
        strategyTitle = "Precision Master";
        strategyDesc = "Your accuracy is excellent, but you are taking too long. You know the concepts well.";
        focusArea = "Focus on time-boxed drills to improve speed.";
        ctaRoute = "/dashboard/practice"; // Precision → chapter-wise practice with timer
    } else if (accuracy < 60 && isFast) {
        strategyTitle = "Speed Demon (Risky)";
        strategyDesc = "You are rushing through questions. Speed is good, but not at the cost of mistakes.";
        focusArea = "Slow down. Review concepts before attempting tests.";
        ctaRoute = "/dashboard/practice"; // Speed Demon → concept-level chapter practice
    } else {
        strategyTitle = "Foundational Building";
        strategyDesc = "Your scores are fluctuating. This often happens when learning new concepts.";
        focusArea = "Focus on topic-wise practice rather than full mocks.";
        ctaRoute = "/dashboard/practice"; // Foundational → chapter-wise drills
    }

    // --- Personal Plan Generation (memoised) ---
    // FIX: useMemo prevents unnecessary recomputation on every render
    const plan = useMemo(() => {
        const result = [];

        // Week 1–2: depends on primary weakness
        if (accuracy < 60) {
            result.push({
                week: "Week 1–2",
                icon: BookOpen,
                color: "from-violet-500 to-purple-600",
                title: "Concept Reinforcement",
                tasks: [
                    "Attempt 1 chapter-wise test daily (25–30 mins)",
                    "Review every wrong answer immediately after each test",
                    "Read explanations for at least 5 questions per session",
                ]
            });
        } else if (!isFast) {
            result.push({
                week: "Week 1–2",
                icon: Clock,
                color: "from-amber-500 to-orange-500",
                title: "Speed Acceleration",
                tasks: [
                    "Set a timer: max 60 seconds per question in practice",
                    "Attempt 2 timed chapter tests daily",
                    "Skip and return — don't get stuck on hard questions",
                ]
            });
        } else {
            result.push({
                week: "Week 1–2",
                icon: Trophy,
                color: "from-emerald-500 to-teal-500",
                title: "Advanced Mock Strategy",
                tasks: [
                    "Attempt 1 full mock test every 2 days",
                    "Target top 10% scorers' patterns in leaderboard",
                    "Re-attempt tests where score < 80%",
                ]
            });
        }

        // FIX: Week label changed from "Week 3" to "Week 2–3" — removes confusing label gap
        result.push({
            week: "Week 2–3",
            icon: BarChart2,
            color: "from-blue-500 to-indigo-600",
            title: isImproving ? "Maintain Momentum" : "Break the Plateau",
            tasks: isImproving
                ? [
                    "Increase test difficulty to previous-year papers",
                    "Focus on your weakest subject from the mastery chart",
                    "Aim for 5% score improvement over last week",
                ]
                : [
                    "Switch to a different subject for 3 days to reset",
                    "Do a 10-question daily quiz for confidence building",
                    "Review analytics after every 3 tests to track sub-topic trends",
                ]
        });

        result.push({
            week: "Week 4",
            icon: Brain,
            color: "from-rose-500 to-pink-600",
            title: "Peak Performance Prep",
            tasks: [
                "Attempt 2 full previous-year papers under exam conditions",
                "Review your Top 3 error categories from the Accuracy Matrix",
                "Take a chapter-wise test in your weakest topic every other day",
            ]
        });

        return result;
    }, [accuracy, isFast, isImproving]);

    return (
        <>
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
                        <button
                            onClick={() => setShowPlan(true)}
                            className="w-full py-3 bg-[#00bfa5] hover:bg-[#00a896] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#00bfa5]/20 flex items-center justify-center gap-2 group active:scale-95"
                        >
                            Generate Personal Plan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Personal Plan Modal */}
            <AnimatePresence>
                {showPlan && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPlan(false)}
                            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-t-3xl p-7 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 bg-indigo-500/30 rounded-lg">
                                                    <Sparkles className="w-4 h-4 text-indigo-300" />
                                                </div>
                                                <span className="text-indigo-300 text-xs font-black uppercase tracking-widest">4-Week AI Study Plan</span>
                                            </div>
                                            <h2 className="text-2xl font-black text-white tracking-tight">{strategyTitle}</h2>
                                            <p className="text-indigo-200/70 text-sm mt-1 font-medium">Personalized based on your performance data</p>
                                        </div>
                                        <button
                                            onClick={() => setShowPlan(false)}
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 hover:text-white transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Summary stats */}
                                    <div className="relative z-10 grid grid-cols-3 gap-3 mt-5">
                                        {[
                                            { label: 'Accuracy', value: `${Math.round(accuracy)}%`, good: accuracy >= 70 },
                                            { label: 'Tests Done', value: stats.totalAttempts || 0, good: (stats.totalAttempts || 0) >= 5 },
                                            { label: 'Trend', value: isImproving ? `+${trendDiff}%` : `${trendDiff}%`, good: isImproving },
                                        ].map((s) => (
                                            <div key={s.label} className="bg-white/10 rounded-2xl px-4 py-3 text-center border border-white/10">
                                                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{s.label}</div>
                                                <div className={`text-xl font-black ${s.good ? 'text-emerald-400' : 'text-amber-400'}`}>{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Plan Weeks */}
                                <div className="p-6 space-y-5">
                                    {plan.map((week, idx) => (
                                        <motion.div
                                            key={week.week}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.08 }}
                                            className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className={`bg-gradient-to-r ${week.color} px-5 py-3 flex items-center gap-3`}>
                                                <week.icon className="w-4 h-4 text-white" />
                                                <span className="text-white font-black text-sm uppercase tracking-widest">{week.week}</span>
                                                <span className="ml-auto text-white/80 font-bold text-sm">{week.title}</span>
                                            </div>
                                            <div className="px-5 py-4 bg-slate-50/50 space-y-3">
                                                {week.tasks.map((task, tIdx) => (
                                                    <div key={tIdx} className="flex items-start gap-3">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm text-slate-600 font-medium leading-snug">{task}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* CTA Footer — route adapts to profile */}
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
                                        <div className="p-2.5 bg-indigo-600 rounded-xl">
                                            <Brain className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-800">
                                                {ctaRoute === '/dashboard/pyp' ? 'Try Previous Year Papers' : 'Start with Chapter Wise Tests'}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">Your quickest path to score improvement based on current data</p>
                                        </div>
                                        <a
                                            href={ctaRoute}
                                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                                        >
                                            Start Now →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

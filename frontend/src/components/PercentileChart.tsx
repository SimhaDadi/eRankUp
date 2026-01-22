'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';

interface PercentileChartProps {
    distribution: number[];
    userScore: number;
    averageScore: number;
    medianScore: number;
}

export function PercentileChart({
    distribution,
    userScore,
    averageScore,
    medianScore
}: PercentileChartProps) {
    const maxCount = Math.max(...distribution);

    // Find user's bucket
    const userBucketIndex = Math.min(Math.floor(userScore / 10), 9);

    return (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Score Distribution</h3>
                        <p className="text-xs text-slate-400">How you compare to other students</p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="mb-6">
                <div className="flex items-end justify-between gap-2 h-48 mb-4">
                    {distribution.map((count, index) => {
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        const scoreRange = `${index * 10}-${(index + 1) * 10}`;
                        const isUserBucket = index === userBucketIndex;

                        return (
                            <motion.div
                                key={index}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: index * 0.05, duration: 0.5 }}
                                className="flex-1 flex flex-col items-center gap-2 group relative"
                            >
                                {/* Bar */}
                                <div className="w-full relative">
                                    <div
                                        className={`w-full rounded-t-lg transition-all ${isUserBucket
                                                ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-lg shadow-blue-500/50'
                                                : 'bg-gradient-to-t from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500'
                                            }`}
                                        style={{ height: `${height}%` }}
                                    />

                                    {/* User marker */}
                                    {isUserBucket && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="absolute -top-8 left-1/2 -translate-x-1/2"
                                        >
                                            <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-lg">
                                                You
                                            </div>
                                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500 mx-auto" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-none z-10 shadow-xl">
                                    <div className="font-bold text-white">{scoreRange}%</div>
                                    <div className="text-slate-400">{count} student{count !== 1 ? 's' : ''}</div>
                                </div>

                                {/* Label */}
                                <span className={`text-xs font-medium ${isUserBucket ? 'text-blue-400' : 'text-slate-500'
                                    }`}>
                                    {index * 10}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* X-axis label */}
                <div className="text-center text-xs text-slate-500 mb-4">Score Range (%)</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{userScore.toFixed(1)}</div>
                    <div className="text-xs text-slate-400 mt-1">Your Score</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-300">{averageScore.toFixed(1)}</div>
                    <div className="text-xs text-slate-400 mt-1">Average</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-300">{medianScore.toFixed(1)}</div>
                    <div className="text-xs text-slate-400 mt-1">Median</div>
                </div>
            </div>

            {/* Performance indicator */}
            <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp className={`w-4 h-4 ${userScore > averageScore ? 'text-emerald-400' : 'text-orange-400'
                    }`} />
                <span className="text-slate-300">
                    {userScore > averageScore ? (
                        <>You scored <span className="font-bold text-emerald-400">{(userScore - averageScore).toFixed(1)}%</span> above average</>
                    ) : userScore === averageScore ? (
                        <>You scored <span className="font-bold text-blue-400">at the average</span></>
                    ) : (
                        <>You scored <span className="font-bold text-orange-400">{(averageScore - userScore).toFixed(1)}%</span> below average</>
                    )}
                </span>
            </div>
        </div>
    );
}

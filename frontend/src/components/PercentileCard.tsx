'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';

interface PercentileCardProps {
    percentile: number;
    rank: number;
    totalStudents: number;
    userScore: number;
    averageScore: number;
    medianScore: number;
    distribution?: number[];
    performanceTier: 'top' | 'above_average' | 'average' | 'below_average';
}

export function PercentileCard({
    percentile,
    rank,
    totalStudents,
    userScore,
    averageScore,
    medianScore,
    distribution,
    performanceTier
}: PercentileCardProps) {
    const tierConfig = {
        top: {
            gradient: 'from-yellow-500 to-orange-500',
            icon: Trophy,
            label: 'Top Performer',
            message: 'Outstanding! You\'re in the top 10%!'
        },
        above_average: {
            gradient: 'from-blue-500 to-purple-500',
            icon: Award,
            label: 'Above Average',
            message: 'Great job! You\'re performing well!'
        },
        average: {
            gradient: 'from-green-500 to-teal-500',
            icon: TrendingUp,
            label: 'Average',
            message: 'Good effort! Keep practicing to improve!'
        },
        below_average: {
            gradient: 'from-slate-500 to-slate-600',
            icon: BarChart3,
            label: 'Needs Improvement',
            message: 'Focus on weak areas to boost your score!'
        }
    };

    const config = tierConfig[performanceTier];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-gradient-to-br ${config.gradient} p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium opacity-90">{config.label}</h3>
                            <p className="text-xs opacity-75">{config.message}</p>
                        </div>
                    </div>
                </div>

                {/* Main Percentile Display */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-6xl font-black">{percentile}</span>
                        <span className="text-3xl font-bold opacity-75">%</span>
                    </div>
                    <p className="text-sm opacity-90">
                        You scored better than <span className="font-bold">{percentile}%</span> of students
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-4 h-4 opacity-75" />
                            <span className="text-xs opacity-75">Your Rank</span>
                        </div>
                        <div className="text-2xl font-bold">#{rank}</div>
                        <div className="text-xs opacity-75">out of {totalStudents}</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-4 h-4 opacity-75" />
                            <span className="text-xs opacity-75">Your Score</span>
                        </div>
                        <div className="text-2xl font-bold">{userScore.toFixed(1)}</div>
                        <div className="text-xs opacity-75">
                            Avg: {averageScore.toFixed(1)} | Med: {medianScore.toFixed(1)}
                        </div>
                    </div>
                </div>

                {/* Distribution Chart */}
                {distribution && distribution.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 opacity-75" />
                            <span className="text-xs font-medium opacity-90">Score Distribution</span>
                        </div>
                        <div className="flex items-end justify-between gap-1 h-20">
                            {distribution.map((count, index) => {
                                const maxCount = Math.max(...distribution);
                                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                const scoreRange = `${index * 10}-${(index + 1) * 10}`;
                                const isUserRange = userScore >= index * 10 && userScore < (index + 1) * 10;

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className={`w-full rounded-t transition-all ${isUserRange ? 'bg-white' : 'bg-white/40'
                                                }`}
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="text-[10px] opacity-60">{index * 10}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

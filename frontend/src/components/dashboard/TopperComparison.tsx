'use client';

import { motion } from 'framer-motion';
import { Trophy, Target, User, TrendingUp } from 'lucide-react';

interface TopperStats {
    topic: string;
    yourScore: number;
    topperScore: number;
}

interface TopperComparisonProps {
    stats: TopperStats[];
}

export default function TopperComparison({ stats }: TopperComparisonProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl h-full flex flex-col">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-transparent">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
                        <Trophy className="text-amber-500 w-8 h-8" />
                        vs. Top Scorers
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Benchmark your subject mastery against the top 1%.</p>
                </div>
                <div className="px-4 py-2 bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold uppercase tracking-wider">
                    Competitive Analytics
                </div>
            </div>

            <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                {stats.map((item, idx) => {
                    const diff = item.topperScore - item.yourScore;
                    const isClose = diff <= 10;

                    return (
                        <div key={idx} className="space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-black text-slate-700 uppercase tracking-wide">{item.topic}</span>
                                <div className="flex gap-4">
                                    <span className={`text-xs flex items-center gap-1 font-bold ${isClose ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        <TrendingUp className="w-3 h-3" />
                                        {Math.abs(diff)}% {item.yourScore > item.topperScore ? 'ahead' : 'gap'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Comparison Bars */}
                                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                    {/* Your Score */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.yourScore}%` }}
                                        className="h-full bg-[#00bfa5] relative z-20 rounded-full"
                                    >
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold leading-none">You</span>
                                    </motion.div>

                                    {/* Topper Score Marker (if higher) */}
                                    {item.topperScore > item.yourScore && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.topperScore}%` }}
                                            className="absolute top-0 left-0 h-full bg-blue-400/30 z-10"
                                        />
                                    )}
                                </div>

                                <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                                    <span>0%</span>
                                    <div className="flex gap-4">
                                        <span className="text-[#00bfa5] font-bold">You: {item.yourScore}%</span>
                                        <span className="text-blue-500 font-bold">Top: {item.topperScore}%</span>
                                    </div>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
                <div className="flex items-center gap-3 text-amber-600">
                    <Target className="w-5 h-5 shrink-0" />
                    <p className="text-sm italic font-medium">
                        "You're within 5% of the top scorers in <strong>Algebra</strong>. Push a bit harder!"
                    </p>
                </div>
            </div>
        </div>
    );
}


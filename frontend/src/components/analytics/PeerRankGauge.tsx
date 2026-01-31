'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users } from 'lucide-react';

export default function PeerRankGauge({ data }: { data: any }) {
    // data = { percentile: 85, rankPrediction: 'Top 500', globalAverage: 65, userAverage: 72 }
    if (!data) return null;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold uppercase text-xs tracking-wider">
                        <Users className="w-4 h-4" /> Peer Comparison
                    </div>
                    <h3 className="text-3xl font-black">{data.rankPrediction}</h3>
                    <p className="text-slate-400 mt-2">
                        You are performing better than <span className="text-indigo-400 font-bold">{data.percentile}%</span> of students.
                    </p>

                    <div className="mt-6 flex flex-col gap-3">
                        <div className="flex justify-between text-sm font-medium text-slate-400">
                            <span>Global Avg Score</span>
                            <span>Your Avg Score</span>
                        </div>
                        <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden relative">
                            {/* Global Marker */}
                            <div
                                className="absolute top-0 bottom-0 bg-slate-500 w-1"
                                style={{ left: `${data.globalAverage}%` }}
                                title="Global Average"
                            />
                            {/* User Bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${data.userAverage}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-full ${data.userAverage >= data.globalAverage ? 'bg-green-500' : 'bg-amber-500'}`}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-500">{data.globalAverage}%</span>
                            <span className={`${data.userAverage >= data.globalAverage ? 'text-green-400' : 'text-amber-400'}`}>{data.userAverage}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center items-center">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="45%"
                                className="stroke-slate-700 fill-none"
                                strokeWidth="12"
                            />
                            <motion.circle
                                initial={{ strokeDashoffset: 283 }}
                                animate={{ strokeDashoffset: 283 - (283 * data.percentile) / 100 }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                cx="50%"
                                cy="50%"
                                r="45%"
                                className="stroke-indigo-500 fill-none"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray="283"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-black">{data.percentile}</span>
                            <span className="text-xs text-indigo-300 font-bold uppercase">%ile</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

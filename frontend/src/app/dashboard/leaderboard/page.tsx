'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Medal,
    TrendingUp,
    Search,
    User,
    ChevronUp,
    Star
} from 'lucide-react';
import api from '@/lib/api';

interface LeaderboardEntry {
    user_id: string;
    user_name: string;
    max_score: number;
    avg_accuracy: number;
}

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await api.get('/exams/performance/leaderboard');
                setEntries(response.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return 'text-yellow-400';
            case 1: return 'text-slate-300';
            case 2: return 'text-amber-600';
            default: return 'text-slate-500';
        }
    };

    const getRankBg = (index: number) => {
        switch (index) {
            case 0: return 'bg-yellow-400/10 border-yellow-400/20';
            case 1: return 'bg-slate-300/10 border-slate-300/20';
            case 2: return 'bg-amber-600/10 border-amber-600/20';
            default: return 'bg-slate-800/20 border-slate-700/50';
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                        <Trophy className="text-yellow-500 w-8 h-8" />
                        Platform Leaderboard
                    </h1>
                    <p className="text-slate-500 mt-1">Compete with the top performers across all examinations.</p>
                </div>
            </header>

            {/* Top 3 Spotlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {entries.slice(0, 3).map((entry, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={entry.user_id}
                        className={`relative p-8 rounded-3xl border text-center shadow-sm ${getRankBg(idx)}`}
                    >
                        <div className="absolute top-4 right-4">
                            <Star className={`w-6 h-6 ${getRankColor(idx)} fill-current`} />
                        </div>
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-100 shadow-xl">
                            <User className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-1 text-slate-900">{entry.user_name}</h3>
                        <div className="text-4xl font-black mb-2 flex items-center justify-center gap-2 text-slate-900">
                            {Math.round(entry.max_score)} <span className="text-sm font-bold text-slate-400">PTS</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                            <TrendingUp className="w-4 h-4" /> {Math.round(entry.avg_accuracy)}% Accuracy
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Table View */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Overall Rankings</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Top Score</th>
                                <th className="px-6 py-4 text-right">Avg Accuracy</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {entries.map((entry, idx) => (
                                <tr key={entry.user_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className={`text-lg font-black ${getRankColor(idx)}`}>
                                            #{idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-slate-500">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-slate-900">{entry.user_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-2xl font-black text-slate-900">{Math.round(entry.max_score)}</div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm border border-emerald-100">
                                            {Math.round(entry.avg_accuracy)}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {entries.length === 0 && !isLoading && (
                        <div className="py-20 text-center text-slate-400">
                            No rankings available yet. Be the first to take a test!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

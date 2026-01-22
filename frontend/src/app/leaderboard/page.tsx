'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface LeaderboardEntry {
    userId: string;
    fullName: string;
    totalXp: number;
    level: number;
    rank: number;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'global' | 'weekly'>('global');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    useEffect(() => {
        fetchLeaderboard();
        fetchCurrentUser();
    }, [activeTab]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const response = await api.get('/gamification/leaderboard');
            setLeaderboard(response.data);
        } catch (error) {
            console.error('Failed to fetch leaderboard', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/gamification/profile');
            setCurrentUserId(response.data.userId);
        } catch (error) {
            console.error('Failed to fetch current user', error);
        }
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'from-yellow-500 to-orange-500';
        if (rank === 2) return 'from-gray-400 to-gray-500';
        if (rank === 3) return 'from-orange-600 to-orange-700';
        return 'from-slate-600 to-slate-700';
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '👑';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-4">🏆 Leaderboard</h1>
                    <p className="text-slate-300">Compete with the best learners</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'global'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        🌍 Global
                    </button>
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'weekly'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        📅 This Week
                    </button>
                </div>

                {loading ? (
                    <div className="text-center text-white">Loading leaderboard...</div>
                ) : (
                    <div className="space-y-3">
                        {leaderboard.map((entry, index) => {
                            const isCurrentUser = entry.userId === currentUserId;

                            return (
                                <motion.div
                                    key={entry.userId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative p-4 rounded-xl border-2 transition-all ${isCurrentUser
                                            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-purple-500 shadow-lg'
                                            : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Rank Badge */}
                                        <div
                                            className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRankColor(
                                                entry.rank
                                            )} flex items-center justify-center font-bold text-white text-xl shadow-lg`}
                                        >
                                            {getRankIcon(entry.rank)}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-white">{entry.fullName}</h3>
                                                {isCurrentUser && (
                                                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-sm text-slate-400">
                                                    ⭐ Level {entry.level}
                                                </span>
                                                <span className="text-sm text-slate-400">
                                                    💎 {entry.totalXp.toLocaleString()} XP
                                                </span>
                                            </div>
                                        </div>

                                        {/* XP Display */}
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">
                                                {entry.totalXp.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-400">Total XP</div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!loading && leaderboard.length === 0 && (
                    <div className="text-center text-slate-400 py-12">
                        <p className="text-xl">No leaderboard data yet</p>
                        <p className="text-sm mt-2">Complete some tests to appear on the leaderboard!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

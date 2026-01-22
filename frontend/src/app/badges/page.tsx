'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface Badge {
    id: string;
    name: string;
    earnedAt: string;
}

interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
    { id: 'first_steps', name: 'First Steps', description: 'Complete your first practice test', icon: '🎯' },
    { id: 'quick_learner', name: 'Quick Learner', description: 'Solve 10 questions correctly', icon: '⚡' },
    { id: 'half_century', name: 'Half Century', description: 'Solve 50 questions correctly', icon: '🎖️' },
    { id: 'century', name: 'Century', description: 'Solve 100 questions correctly', icon: '💯' },
    { id: 'double_century', name: 'Double Century', description: 'Solve 200 questions correctly', icon: '🏆' },
    { id: 'streak_3', name: '3-Day Streak', description: 'Practice for 3 consecutive days', icon: '🔥' },
    { id: 'week_warrior', name: 'Week Warrior', description: 'Maintain 7-day streak', icon: '🔥🔥' },
    { id: 'month_master', name: 'Month Master', description: 'Maintain 30-day streak', icon: '🔥🔥🔥' },
    { id: 'perfectionist', name: 'Perfectionist', description: 'Score 100% in any test', icon: '⭐' },
    { id: 'perfect_trio', name: 'Perfect Trio', description: 'Score 100% in 3 tests', icon: '⭐⭐⭐' },
    { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5', icon: '🌟' },
    { id: 'level_10', name: 'Dedicated Learner', description: 'Reach Level 10', icon: '✨' },
    { id: 'level_25', name: 'Expert', description: 'Reach Level 25', icon: '💫' },
    { id: 'level_50', name: 'Legend', description: 'Reach Level 50', icon: '👑' },
    { id: 'xp_1000', name: 'Thousand Club', description: 'Earn 1000 XP', icon: '🎊' },
    { id: 'xp_5000', name: 'Five Thousand Club', description: 'Earn 5000 XP', icon: '🎉' },
    { id: 'xp_10000', name: 'Ten Thousand Club', description: 'Earn 10000 XP', icon: '🏅' },
];

export default function BadgesShowcase() {
    const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            const response = await api.get('/gamification/profile');
            setEarnedBadges(response.data.badges || []);
        } catch (error) {
            console.error('Failed to fetch badges', error);
        } finally {
            setLoading(false);
        }
    };

    const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">🏆 Badge Collection</h1>
                    <p className="text-slate-300 text-lg">
                        {earnedBadges.length} of {BADGE_DEFINITIONS.length} badges earned
                    </p>
                    <div className="mt-4 w-full max-w-md mx-auto bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-500"
                            style={{ width: `${(earnedBadges.length / BADGE_DEFINITIONS.length) * 100}%` }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-white">Loading badges...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {BADGE_DEFINITIONS.map((badge, index) => {
                            const isEarned = earnedBadgeIds.has(badge.id);
                            const earnedBadge = earnedBadges.find(b => b.id === badge.id);

                            return (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${isEarned
                                            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500 shadow-lg shadow-yellow-500/50'
                                            : 'bg-slate-800/50 border-slate-700 opacity-60'
                                        }`}
                                >
                                    {isEarned && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                            ✓ Earned
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <div className={`text-6xl mb-4 ${!isEarned && 'grayscale opacity-40'}`}>
                                            {badge.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{badge.name}</h3>
                                        <p className="text-sm text-slate-300 mb-3">{badge.description}</p>

                                        {isEarned && earnedBadge && (
                                            <p className="text-xs text-slate-400">
                                                Earned on {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                                            </p>
                                        )}

                                        {!isEarned && (
                                            <div className="mt-4 text-xs text-slate-500">
                                                🔒 Locked
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

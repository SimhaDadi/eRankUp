'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface DailyChallenge {
    id: string;
    description: string;
    targetValue: number;
    rewardXp: number;
    challengeType: string;
}

interface ChallengeProgress {
    currentValue: number;
    completed: boolean;
}

export default function DailyChallengeCard() {
    const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
    const [progress, setProgress] = useState<ChallengeProgress | null>(null);
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        fetchChallenge();
        updateTimeRemaining();
        const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const fetchChallenge = async () => {
        try {
            const challengeRes = await api.get('/gamification/daily-challenge');
            setChallenge(challengeRes.data);

            if (challengeRes.data.id) {
                const progressRes = await api.get(`/gamification/challenge-progress/${challengeRes.data.id}`);
                setProgress(progressRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch challenge', error);
        }
    };

    const updateTimeRemaining = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
    };

    if (!challenge) return null;

    const progressPercent = progress
        ? Math.min((progress.currentValue / challenge.targetValue) * 100, 100)
        : 0;

    return (
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500 rounded-2xl p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">🎯</span>
                        <h3 className="text-2xl font-bold text-white">Daily Challenge</h3>
                    </div>
                    <p className="text-slate-300">{challenge.description}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Expires in</div>
                    <div className="text-xl font-bold text-orange-400">{timeRemaining}</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white font-semibold">
                        {progress?.currentValue || 0} / {challenge.targetValue}
                    </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${progressPercent}%` }}
                    >
                        {progressPercent > 20 && (
                            <span className="text-xs font-bold text-white">{Math.round(progressPercent)}%</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Reward */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <span className="text-white font-semibold">Reward: {challenge.rewardXp} XP</span>
                </div>

                {progress?.completed ? (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                        ✓ Completed!
                    </div>
                ) : (
                    <div className="bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm">
                        In Progress
                    </div>
                )}
            </div>
        </div>
    );
}

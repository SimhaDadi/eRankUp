'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface GamificationProfile {
    totalXp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    badges: Array<{ id: string; name: string; earnedAt: string }>;
}

export default function GamificationHUD() {
    const [profile, setProfile] = useState<GamificationProfile | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/gamification/profile');
            setProfile(response.data);
        } catch (error) {
            console.error('Failed to fetch gamification profile', error);
        }
    };

    if (!profile) return null;

    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
    const currentLevelXp = levelThresholds[profile.level - 1] || 0;
    const nextLevelXp = levelThresholds[profile.level] || currentLevelXp + 1000;
    const xpInCurrentLevel = profile.totalXp - currentLevelXp;
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
    const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

    return (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <span className="text-white font-bold">{profile.currentStreak} day streak</span>
                </div>
                <div className="text-xs text-slate-400">
                    Best: {profile.longestStreak}
                </div>
            </div>

            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <span className="text-white font-bold">Level {profile.level}</span>
                </div>
                <div className="text-xs text-slate-400">
                    {profile.badges.length} badges
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-400">XP Progress</span>
                    <span className="text-white font-medium">
                        {xpInCurrentLevel}/{xpNeededForNextLevel}
                    </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>

            <div className="mt-3 text-center text-xs text-slate-500">
                {Math.max(0, xpNeededForNextLevel - xpInCurrentLevel)} XP to next level
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface TopicMastery {
    topic: string;
    masteryScore: number;
    totalAttempts: number;
    correctAttempts: number;
    lastPracticedAt: string;
}

export default function MasteryHeatmap() {
    const [masteryData, setMasteryData] = useState<TopicMastery[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMasteryData();
    }, []);

    const fetchMasteryData = async () => {
        try {
            const response = await api.get('/adaptive/mastery');
            setMasteryData(response.data.topics || []);
        } catch (error) {
            console.error('Failed to fetch mastery data', error);
        } finally {
            setLoading(false);
        }
    };

    const getMasteryColor = (score: number) => {
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.6) return 'bg-yellow-500';
        if (score >= 0.4) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getMasteryLabel = (score: number) => {
        if (score >= 0.8) return 'Mastered';
        if (score >= 0.6) return 'Good';
        if (score >= 0.4) return 'Learning';
        return 'Needs Practice';
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">📊 Topic Mastery</h2>
                    <p className="text-slate-400 text-sm">Your performance across different topics</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-slate-400">Needs Practice</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span className="text-slate-400">Learning</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-slate-400">Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-slate-400">Mastered</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Loading mastery data...</div>
            ) : masteryData.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                    <p>No mastery data yet</p>
                    <p className="text-sm mt-2">Complete some tests to see your topic mastery</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {masteryData.map((topic) => (
                        <div
                            key={topic.topic}
                            className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-white font-semibold">{topic.topic}</h3>
                                <div
                                    className={`${getMasteryColor(
                                        topic.masteryScore
                                    )} text-white text-xs px-2 py-1 rounded-full font-bold`}
                                >
                                    {Math.round(topic.masteryScore * 100)}%
                                </div>
                            </div>

                            <div className="space-y-2 mb-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-slate-300">{getMasteryLabel(topic.masteryScore)}</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`${getMasteryColor(topic.masteryScore)} h-full transition-all duration-500`}
                                        style={{ width: `${topic.masteryScore * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>
                                    {topic.correctAttempts}/{topic.totalAttempts} correct
                                </span>
                                {topic.lastPracticedAt && (
                                    <span>
                                        Last: {new Date(topic.lastPracticedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

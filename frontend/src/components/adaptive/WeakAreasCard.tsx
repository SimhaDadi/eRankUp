'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface WeakArea {
    topic: string;
    masteryScore: number;
    totalAttempts: number;
    correctAttempts: number;
}

export default function WeakAreasCard() {
    const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchWeakAreas();
    }, []);

    const fetchWeakAreas = async () => {
        try {
            const response = await api.get('/adaptive/weak-areas?limit=5');
            setWeakAreas(response.data);
        } catch (error) {
            console.error('Failed to fetch weak areas', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePractice = async (topic: string) => {
        // Navigate to adaptive practice for this topic
        router.push(`/practice?topic=${encodeURIComponent(topic)}&mode=adaptive`);
    };

    return (
        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">⚠️</span>
                <div>
                    <h2 className="text-2xl font-bold text-white">Weak Areas</h2>
                    <p className="text-slate-300 text-sm">Topics that need more practice</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-white py-4">Loading...</div>
            ) : weakAreas.length === 0 ? (
                <div className="text-center text-slate-300 py-8">
                    <p className="text-lg">🎉 No weak areas!</p>
                    <p className="text-sm mt-2">You're doing great across all topics</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {weakAreas.map((area, index) => (
                        <div
                            key={area.topic}
                            className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{area.topic}</h3>
                                        <p className="text-xs text-slate-400">
                                            {area.correctAttempts}/{area.totalAttempts} correct (
                                            {Math.round((area.correctAttempts / area.totalAttempts) * 100)}%)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handlePractice(area.topic)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                                >
                                    Practice Now
                                </button>
                            </div>

                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-500"
                                    style={{ width: `${area.masteryScore * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {weakAreas.length > 0 && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/learning-path')}
                        className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-slate-100 transition-all"
                    >
                        📚 View Full Learning Path
                    </button>
                </div>
            )}
        </div>
    );
}

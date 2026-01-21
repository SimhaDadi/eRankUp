'use client';

import { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import DetailedBreakdown from './DetailedBreakdown';

interface TopicPerformance {
    topic: string;
    score: number;
    total: number;
    color: string;
}

export default function PerformanceHeatmap() {
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

    // Semi-mock data for demonstration
    // In real app, this would be fetched from /exams/user/stats
    const data = [
        { subject: 'Algebra', A: 85, fullMark: 100 },
        { subject: 'Geometry', A: 40, fullMark: 100 },
        { subject: 'Trigonometry', A: 70, fullMark: 100 },
        { subject: 'Calculus', A: 55, fullMark: 100 },
        { subject: 'Probability', A: 90, fullMark: 100 },
        { subject: 'Statistics', A: 75, fullMark: 100 },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2 text-slate-900">
                        <Target className="w-6 h-6 text-[#00bfa5]" /> Topic Performance
                    </h2>
                    <p className="text-slate-500 text-sm">Visualizing your mastery across different mathematics domains.</p>
                </div>
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Steady Progress</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            />
                            <Radar
                                name="Mastery"
                                dataKey="A"
                                stroke="#00bfa5"
                                fill="#00bfa5"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-6">
                    <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Analysis & Insights</h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                <Target className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="font-bold text-emerald-700 text-sm">Strength: Probability</div>
                                <p className="text-xs text-slate-600 mt-0.5">You consistently score above 90% in this area. Focus on speed now.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="font-bold text-amber-700 text-sm">Focus Area: Geometry</div>
                                <p className="text-xs text-slate-600 mt-0.5">Your accuracy is lower here. We recommend practicing "Circle Theorems".</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsBreakdownOpen(true)}
                        className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all text-sm shadow-lg shadow-slate-900/20"
                    >
                        View Detailed Breakdown
                    </button>

                    <DetailedBreakdown
                        isOpen={isBreakdownOpen}
                        onClose={() => setIsBreakdownOpen(false)}
                    />
                </div>
            </div>
        </div>
    );
}


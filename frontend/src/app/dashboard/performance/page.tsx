'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Activity,
    TrendingUp,
    Target,
    Clock,
    Award,
    Calendar,
    Sparkles,
    Zap,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import PerformanceHeatmap from '@/components/dashboard/PerformanceHeatmap';
import TopperComparison from '@/components/dashboard/TopperComparison';
import MacroAIInsights from '@/components/dashboard/MacroAIInsights';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

export default function PerformancePage() {
    const [trendData, setTrendData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [topperStats, setTopperStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';



    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trendRes, statsRes, topperRes] = await Promise.all([
                    api.get('/exams/performance/trend?limit=15'),
                    api.get('/exams/user/stats'),
                    api.get('/adaptive/mastery')
                ]);

                if (trendRes.data) {
                    const formatted = trendRes.data.map((item: any) => ({
                        id: item.id,
                        date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        title: item.exam?.title || item.model?.title || 'Practice Module',
                        score: item.score,
                        accuracy: item.accuracy,
                        time: Math.round(item.timeTaken / 60)
                    }));
                    setTrendData(formatted);
                }

                setStats(statsRes.data);
                setTopperStats(topperRes.data);
            } catch (error) {
                console.error("Failed to fetch performance data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatTime = (seconds: number) => {
        if (!seconds) return '0s';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <header className="relative overflow-hidden bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00bfa5]/10 text-[#00bfa5] text-xs font-black uppercase tracking-widest mb-4">
                        <Sparkles className="w-4 h-4" /> Your Growth Journey
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        Performance <span className="text-[#00bfa5]">Analytics</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl">
                        Deep dive into your learning metrics. Visualize your progress, optimize your speed, and master your subjects.
                    </p>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#00bfa5]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Overall Score"
                    value={`${stats?.averageScore || 0}%`}
                    subValue="Average"
                    icon={TrendingUp}
                    color="text-[#00bfa5]"
                    bg="bg-[#00bfa5]/10"
                />
                <StatCard
                    label="Accuracy"
                    value={`${stats?.accuracy || 0}%`}
                    subValue="Precision"
                    icon={Target}
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <StatCard
                    label="Speed"
                    value={formatTime(stats?.totalTimeTaken ? Math.round(stats.totalTimeTaken / (stats.totalAttempts || 1)) : 0)}
                    subValue="Avg. Time/Test"
                    icon={Clock}
                    color="text-violet-500"
                    bg="bg-violet-50"
                />
                <StatCard
                    label="Dedication"
                    value={(stats?.totalAttempts || 0).toString()}
                    subValue="Tests Completed"
                    icon={Award}
                    color="text-amber-500"
                    bg="bg-amber-50"
                />
            </div>

            {/* Macro AI Analysis Section */}
            <MacroAIInsights stats={stats} trendData={trendData} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Heatmap Section - Now taking 2 columns */}
                <div className="lg:col-span-2 h-full">
                    <PerformanceHeatmap data={stats?.topicPerformance} />
                </div>

                {/* Main Trend Chart - Now taking 1 column */}
                <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl shadow-slate-200/40">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-[#00bfa5]" /> Curve
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mt-1">Score trend</p>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00bfa5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#00bfa5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        fontWeight={600}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `${val}%`}
                                        domain={[0, 100]}
                                        fontWeight={600}
                                        width={30}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        formatter={(value: any) => [`${value}%`, 'Score']}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                                        cursor={{ stroke: '#00bfa5', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#00bfa5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#00bfa5' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                                <Activity className="w-10 h-10 opacity-20" />
                                <div className="font-bold uppercase tracking-widest text-xs">No enough data</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <TopperComparison stats={topperStats} />
                </div>

                {/* Activity Log */}
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden h-fit shadow-xl shadow-slate-200/40">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-400" /> Recent Activity
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {trendData.slice().reverse().filter(item =>
                            item.title.toLowerCase().includes(searchQuery.toLowerCase())
                        ).slice(0, 5).map((item, idx) => (
                            <div
                                key={idx}
                                className="p-4 hover:bg-slate-50 transition-colors group relative border-b border-gray-50 last:border-0"
                            >
                                {/* Top Row: Score + Title */}
                                <div className="flex items-start gap-4 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${item.score >= 80 ? 'bg-emerald-100 text-emerald-600' :
                                        item.score >= 60 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        {item.score}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-sm leading-tight mb-1">{item.title}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.date}</div>
                                    </div>
                                </div>

                                {/* Bottom Row: Stats + Buttons */}
                                <div className="flex items-center justify-between pl-14">
                                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                        <span>{item.accuracy}% Acc.</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span>{item.time} min</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/dashboard/solutions/${item.id}`}
                                            className="px-3 py-1.5 bg-white border border-[#00bfa5] text-[#00bfa5] text-[10px] font-bold rounded-lg hover:bg-[#00bfa5] hover:text-white transition-all shadow-sm"
                                        >
                                            Solution
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, subValue, icon: Icon, color, bg }: any) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-gray-100 p-6 rounded-3xl shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-slate-200/40 transition-all group"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg group-hover:bg-[#00bfa5] group-hover:text-white transition-colors">{subValue}</span>
            </div>
            <div className="text-4xl font-black mb-1 text-slate-900 tracking-tight">{value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</div>
        </motion.div>
    );
}

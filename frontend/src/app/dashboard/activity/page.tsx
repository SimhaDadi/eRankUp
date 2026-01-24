'use client';

import { useEffect, useState } from 'react';
import {
    Activity,
    Calendar,
    Search,
    Filter,
    ArrowRight,
    TrendingUp,
    Clock,
    Target
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { motion } from 'framer-motion';

export default function ActivityPage() {
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                // Fetch full trend data which contains all attempts
                const res = await api.get('/exams/performance/trend');
                if (res.data) {
                    const formatted = res.data.map((item: any) => ({
                        id: item.id,
                        date: new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                        rawDate: new Date(item.createdAt),
                        title: item.exam?.title || item.model?.title || 'Practice Module',
                        score: item.score,
                        accuracy: item.accuracy,
                        time: Math.round(item.timeTaken / 60),
                        type: item.exam ? 'Mock Test' : 'Usage'
                    }));
                    // Sort by newest first
                    formatted.sort((a: any, b: any) => b.rawDate - a.rawDate);
                    setActivities(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch activity", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivity();
    }, []);

    const filteredActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest mb-4">
                        <Activity className="w-4 h-4" /> Full History
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Your Activity <span className="text-blue-600">Log</span>
                    </h1>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search specific test..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-80 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-300 text-slate-700"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                        Loading Activity...
                    </div>
                ) : filteredActivities.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredActivities.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 ${item.score >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-100' :
                                            item.score >= 60 ? 'bg-blue-50 border-blue-100 text-blue-600 shadow-blue-100' :
                                                'bg-orange-50 border-orange-100 text-orange-600 shadow-orange-100'
                                        }`}>
                                        <span className="text-xl font-black tracking-tight">{Math.round(item.score)}%</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Score</span>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                {item.type}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                <Calendar className="w-3 h-3" /> {item.date}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Target className="w-3.5 h-3.5" /> {item.accuracy}% Accuracy
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" /> {item.time} min
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pl-22 md:pl-0">
                                    <Link
                                        href={`/dashboard/results/${item.id}`}
                                        className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-all shadow-sm active:scale-95 text-sm"
                                    >
                                        View Analysis
                                    </Link>
                                    <Link
                                        href={`/dashboard/solutions/${item.id}`}
                                        className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                        title="View Solutions"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">No activity found</h3>
                        <p className="text-slate-400">Try adjusting your search or take a test to see history here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

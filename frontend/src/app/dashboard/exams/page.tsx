'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Search, Sparkles, Trophy, Users, Globe, ChevronRight, Bookmark, Rocket, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface Exam {
    id: string;
    title: string;
    description: string;
    isPremium: boolean;
    price: number;
    chapters?: any[];
}

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const response = await api.get('/exams');
            setExams(response.data);
        } catch (error) {
            console.error('Failed to fetch exams', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredExams = exams.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-[#fbfdff]">
                <div className="relative">
                    <div className="w-10 h-10 border-[2px] border-sky-100 border-t-sky-500 rounded-full animate-spin" />
                </div>
                <p className="mt-4 text-sky-400 font-bold uppercase tracking-[0.2em] text-[9px]">Calming Spectrum...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfdff] pb-24 relative overflow-hidden text-slate-900">
            {/* Ambient Breeze Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[160px]" />
                <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-emerald-50/50 rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 space-y-12">
                {/* Hero Header Section - BREEZE ZEN */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-sky-50/50">
                    <div className="space-y-4 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2.5"
                        >
                            <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center border border-sky-100">
                                <Rocket className="w-4 h-4 text-sky-500" />
                            </div>
                            <h4 className="font-bold text-[10px] text-sky-600 uppercase tracking-[0.4em]">Academy Discovery</h4>
                        </motion.div>

                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                            Test <span className="text-sky-600">Series</span> <span className="text-emerald-500">Hub</span>
                        </h1>

                        <p className="text-slate-500 font-medium text-lg tracking-tight leading-snug">
                            Premium simulations architected for <span className="text-sky-600 font-bold">maximum performance</span>.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-sky-50 shadow-sm">
                        <div className="flex -space-x-1.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black
                                     ${i === 1 ? 'bg-sky-500 text-white' : i === 2 ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-sky-400'}
                                 `}>
                                    {i === 1 ? 'U1' : i === 2 ? 'U2' : '+9'}
                                </div>
                            ))}
                        </div>
                        <div className="h-5 w-[1px] bg-slate-100" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Access</span>
                    </div>
                </div>

                {/* Search Bar - BREEZE GLASS */}
                <div className="relative max-w-xl">
                    <div className="relative flex items-center bg-white/80 backdrop-blur-xl border border-sky-100/50 p-1.5 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 flex items-center justify-center text-sky-400">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find your series..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent w-full px-2 py-2.5 outline-none text-base font-bold text-slate-700 placeholder-slate-300"
                        />
                        <button className="bg-sky-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/10 mr-1">
                            Search
                        </button>
                    </div>
                </div>

                {/* Grid - BREEZE CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredExams.map((exam, index) => (
                            <ExamCard key={exam.id} exam={exam} index={index} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function ExamCard({ exam, index }: { exam: Exam, index: number }) {
    // Breeze Palette: alternating light blue and mint
    const themes = [
        { accent: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100", light: "bg-sky-50/50", icon: "text-sky-500", glow: "shadow-sky-600/5" },
        { accent: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", light: "bg-emerald-50/50", icon: "text-emerald-500", glow: "shadow-emerald-600/5" },
        { accent: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", light: "bg-blue-50/50", icon: "text-blue-500", glow: "shadow-blue-600/5" }
    ];
    const { accent, bg, border, light, icon, glow } = themes[index % themes.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group relative h-full"
        >
            <div className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-sm transition-all duration-300 h-full flex flex-col relative overflow-hidden hover:shadow-md hover:border-sky-100/50 hover:bg-slate-50/30`}>

                {/* Midnight Silk Lining - Structural Definition */}
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-slate-900/10 group-hover:bg-sky-600/20 transition-colors" />

                {/* Stylish Breeze Top Lining */}
                <div className={`absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent ${index % 2 === 0 ? 'via-sky-400/30' : 'via-emerald-400/30'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />

                {/* Icon Hub */}
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center border ${border}`}>
                        <BookOpen className={`w-5 h-5 ${icon}`} />
                    </div>

                    {exam.isPremium && (
                        <div className={`flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100`}>
                            Premium
                        </div>
                    )}
                </div>

                <div className="space-y-2 mb-6">
                    <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-sky-600 transition-colors">
                        {exam.title}
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-slate-300" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">12.4k Enrolled</span>
                        </div>
                    </div>
                </div>

                <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-2 mb-8 flex-1">
                    {exam.description || 'Access high-fidelity test series architected for elite results.'}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-auto">
                    <Link
                        href={`/dashboard/exams/${exam.id}`}
                        className={`flex-1 bg-sky-600 text-white text-[10px] font-black py-3 rounded-xl transition-all hover:bg-sky-700 active:scale-95 text-center uppercase tracking-[0.2em]`}
                    >
                        Enter Series
                    </Link>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-sky-500 transition-all border border-slate-100">
                        <Bookmark className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

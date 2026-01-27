'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    ChevronRight,
    Loader2,
    Layers,
    Target,
    Brain,
    Folder,
    Sparkles,
    Zap,
    BookOpen,
    ChevronDown,
    Activity
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PremiumEmptyState from '@/components/ui/PremiumEmptyState';

interface Chapter {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    modelCount?: number;
}

interface Subject {
    id: string;
    title?: string;
    name?: string;
    icon?: string;
    chapters: Chapter[];
}

export default function PracticePage() {
    const router = useRouter();
    const [hierarchy, setHierarchy] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const response = await api.get('/exams/hierarchy');
                setHierarchy(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Failed to fetch practice hierarchy", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHierarchy();
    }, []);

    const filteredHierarchy = hierarchy.filter(subject => {
        const subjectTitle = subject.title || subject.name || '';
        const subjectMatches = subjectTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const chapterMatches = subject.chapters?.some(chapter => {
            const chapterTitle = chapter.title || chapter.name || '';
            return chapterTitle.toLowerCase().includes(searchQuery.toLowerCase());
        });
        return subjectMatches || chapterMatches;
    });

    // Automatically expand subject if search query matches a chapter
    useEffect(() => {
        if (searchQuery) {
            const firstMatchingSubject = hierarchy.find(subject =>
                subject.chapters?.some(chapter => {
                    const chapterTitle = chapter.title || chapter.name || '';
                    return chapterTitle.toLowerCase().includes(searchQuery.toLowerCase());
                })
            );
            if (firstMatchingSubject && expandedSubject !== firstMatchingSubject.id) {
                setExpandedSubject(firstMatchingSubject.id);
            }
        }
    }, [searchQuery, hierarchy]);

    const startChapterPractice = async (chapterId: string) => {
        try {
            await api.post('/test-session/start/chapter', { chapterId });
            router.push(`/dashboard/test/chapter-${chapterId}`);
        } catch (error) {
            console.error("Failed to start chapter practice", error);
            alert("Failed to initiate practice session. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#fbfdff]">
                <div className="w-12 h-12 border-[3px] border-sky-100 border-t-sky-500 rounded-full animate-spin" />
                <p className="mt-4 text-sky-400 font-black uppercase tracking-[0.2em] text-[10px]">Assembling Curriculum...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfdff] pb-24 overflow-x-hidden selection:bg-sky-100 selection:text-sky-900">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-sky-100 rounded-full blur-[100px]" />
                <div className="absolute bottom-[0%] right-[-5%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-sky-50 text-sky-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-sky-100">
                            Mastery Mode
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            <Sparkles className="w-3 h-3 fill-current" /> Chapter-wise
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                            Curated Practice
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-snug tracking-tight max-w-2xl">
                            Architect elite domain expertise through high-fidelity, topic-specific practice modules.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AnimatePresence mode="wait">
                        {filteredHierarchy.length === 0 ? (
                            <PremiumEmptyState
                                icon={Brain}
                                title={searchQuery ? "No matches found" : "Curriculum Loading"}
                                description={searchQuery ? `No subjects or chapters found for "${searchQuery}".` : "Our academic team is currently structuring high-fidelity practice modules for your specific goals. Check back shortly."}
                                colorScheme="sky"
                                actionLabel={searchQuery ? "Clear Search" : "Refresh Curriculum"}
                                onAction={() => searchQuery ? window.history.pushState({}, '', window.location.pathname) : window.location.reload()}
                            />
                        ) : (
                            filteredHierarchy.map((subject, idx) => (
                                <motion.div
                                    key={subject.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`bg-white border rounded-[2.5rem] overflow-hidden transition-all duration-500 relative group
                                        ${expandedSubject === subject.id ? 'border-sky-200 shadow-xl' : 'border-sky-50 shadow-sm hover:border-sky-200 hover:shadow-lg'}`}
                                >
                                    {/* Top Accent Line */}
                                    <div className={`absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-emerald-400 to-transparent opacity-0 group-hover:opacity-60 transition-opacity`} />

                                    <div
                                        className="p-8 cursor-pointer relative"
                                        onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-sky-50 rounded-[1.5rem] border border-sky-100 flex items-center justify-center shadow-sm group-hover:bg-white transition-colors duration-300">
                                                    <BookOpen className="w-7 h-7 text-sky-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-sky-600 transition-colors">
                                                        {subject.title || subject.name}
                                                    </h3>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Layers className="w-3 h-3" /> {subject.chapters?.length || 0} Modules
                                                        </span>
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Activity className="w-3 h-3" /> Online
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`w-10 h-10 rounded-xl border border-sky-50 flex items-center justify-center transition-all duration-300
                                                ${expandedSubject === subject.id ? 'bg-sky-600 border-sky-600 text-white rotate-180 shadow-lg shadow-sky-600/20' : 'bg-white text-slate-400 group-hover:border-sky-200 group-hover:text-sky-500'}`}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedSubject === subject.id && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: 'auto' }}
                                                exit={{ height: 0 }}
                                                className="bg-slate-50/50 border-t border-sky-50"
                                            >
                                                <div className="p-6 space-y-3">
                                                    {subject.chapters?.map((chapter) => (
                                                        <motion.div
                                                            key={chapter.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="flex items-center justify-between p-4 bg-white border border-sky-50/50 rounded-2xl hover:border-sky-200 hover:shadow-md transition-all group/chapter"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-sky-50/50 border border-sky-100/50 flex items-center justify-center text-sky-600 group-hover/chapter:bg-sky-600 group-hover/chapter:text-white transition-all">
                                                                    <Book className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-700 tracking-tight group-hover/chapter:text-sky-600 transition-colors">
                                                                        {chapter.title || chapter.name}
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Practice Module</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startChapterPractice(chapter.id);
                                                                }}
                                                                className="px-6 py-2.5 bg-white border border-sky-100 text-sky-600 hover:bg-sky-600 hover:text-white hover:border-sky-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                                                            >
                                                                Launch
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                    {(!subject.chapters || subject.chapters.length === 0) && (
                                                        <div className="text-center py-8">
                                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                                                <Folder className="w-5 h-5 text-slate-300" />
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expansion Imminent</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

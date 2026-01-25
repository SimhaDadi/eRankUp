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
    Folder
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface Chapter {
    id: string;
    title: string;
    description?: string;
    modelCount?: number;
}

interface Subject {
    id: string;
    title: string;
    icon?: string;
    chapters: Chapter[];
}

interface ExamCategory {
    name: string;
    subjects: Subject[];
}

export default function PracticePage() {
    const [hierarchy, setHierarchy] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // UI State
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                // Determine if we have a hierarchy endpoint or need to build it
                // Assuming /exams/hierarchy gives us nested structure
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
                    Chapter-wise Practice
                </h1>
                <p className="text-slate-400 text-lg">
                    Master specific topics with focused chapter-wise tests.
                </p>
            </div>

            {/* Content - Since hierarchy might be complex, we list subjects primarily */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {hierarchy.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Brain className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-300 mb-2">No practice content yet</h3>
                            <p className="text-slate-500">Practice chapters will appear here once configured.</p>
                        </div>
                    ) : (
                        hierarchy.map((subject) => (
                            <motion.div
                                layout
                                key={subject.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all"
                            >
                                <div
                                    className="p-6 cursor-pointer flex justify-between items-center group"
                                    onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Book className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{subject.title}</h3>
                                            <p className="text-slate-500 text-sm">{subject.chapters?.length || 0} Chapters</p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${expandedSubject === subject.id ? 'rotate-90' : ''}`} />
                                </div>

                                <AnimatePresence>
                                    {expandedSubject === subject.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-slate-800 bg-slate-950/30"
                                        >
                                            <div className="p-4 space-y-2">
                                                {subject.chapters?.map((chapter: any) => (
                                                    <div key={chapter.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors group/chapter">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                                <Layers className="w-4 h-4 text-emerald-500" />
                                                            </div>
                                                            <span className="font-medium text-slate-300 group-hover/chapter:text-white transition-colors">
                                                                {chapter.title}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                // Logic to start practice for this chapter
                                                                // Likely navigate to a test runner or model selector
                                                                // For now, assume it starts a session
                                                                alert(`Starting practice for ${chapter.title}`);
                                                            }}
                                                            className="px-4 py-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-sm font-bold transition-all"
                                                        >
                                                            Start
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!subject.chapters || subject.chapters.length === 0) && (
                                                    <div className="text-center text-slate-500 text-sm py-4">No chapters found for this subject.</div>
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
    );
}

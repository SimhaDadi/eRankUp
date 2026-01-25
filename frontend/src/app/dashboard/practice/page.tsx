'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, Play, BrainCircuit, Target, Award } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function PracticePage() {
    const [hierarchy, setHierarchy] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                // Reuse the hierarchy endpoint but we might need to filter for specific types or just get all
                // Actually hierarchy endpoint returns Exams -> Subjects -> Chapters
                // We want Subjects -> Chapters directly.
                // But the current API structure is Exam-centric.
                // Let's use the '/exams/subjects/all' endpoint if it exists or parse from hierarchy.
                // Existing `findAllSubjects` in Service returns subjects with chapters!
                const res = await api.get('/exams/subjects/all');
                setHierarchy(res.data);
            } catch (error) {
                console.error("Failed to fetch practice hierarchy", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHierarchy();
    }, []);

    const handleStartPractice = async (chapterId: string) => {
        setLoading(true);
        try {
            // Start a chapter session via backend
            const res = await api.post('/test-session/start/chapter', { chapterId });
            const sessionId = res.data.testId; // format: chapter-{chapterId} usually, or session ID
            // Redirect to test player with session context
            // Correct logic: /dashboard/test/[id]
            window.location.href = `/dashboard/test/${sessionId}`;
        } catch (error) {
            console.error("Failed to start practice session", error);
            alert("Failed to start practice session. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-pulse text-slate-400 font-medium">Loading Practice Modules...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                            Chapter-wise Practice
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Master your weak areas with targeted mini-tests.
                        </p>
                    </div>

                    {/* Stats Summary (Placeholder for now) */}
                    <div className="flex gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-slate-900">{hierarchy.length}</div>
                                <div className="text-xs text-slate-500 font-medium">Subjects</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-slate-900">
                                    {hierarchy.reduce((acc, sub) => acc + (sub.chapters?.length || 0), 0)}
                                </div>
                                <div className="text-xs text-slate-500 font-medium">Chapters</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hierarchy.map((subject, index) => (
                        <motion.div
                            key={subject.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedSubject === subject.id
                                ? 'ring-2 ring-blue-500 shadow-xl border-transparent col-span-1 md:col-span-2 lg:col-span-3'
                                : 'hover:shadow-lg border-slate-100 hover:border-slate-200 cursor-pointer'
                                }`}
                            onClick={() => {
                                if (expandedSubject !== subject.id) setExpandedSubject(subject.id);
                            }}
                        >
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                                        ${expandedSubject === subject.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}
                                    `}>
                                        {subject.icon ? (
                                            // Dynamic Icon could go here, for now use first letter
                                            subject.title[0]
                                        ) : (
                                            <BookOpen className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{subject.title}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{subject.chapters?.length || 0} Chapters</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedSubject(expandedSubject === subject.id ? null : subject.id);
                                    }}
                                    className={`p-2 rounded-full transition-transform duration-300 ${expandedSubject === subject.id ? 'rotate-90 bg-slate-100' : ''
                                        }`}
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <AnimatePresence>
                                {expandedSubject === subject.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-100 bg-slate-50/50"
                                    >
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {subject.chapters?.map((chapter: any) => (
                                                <div
                                                    key={chapter.id}
                                                    className="bg-white p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                            {chapter.title}
                                                        </h4>
                                                        <span className="text-xs font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-md">
                                                            Q-Bank
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2.5em]">
                                                        {chapter.description || 'Practice questions from this chapter.'}
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleStartPractice(chapter.id);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                                                    >
                                                        <Play className="w-4 h-4 fill-current" />
                                                        Start Practice
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

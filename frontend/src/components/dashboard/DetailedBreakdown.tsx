'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Clock, TrendingUp, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react';

interface DetailedBreakdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DetailedBreakdown({ isOpen, onClose }: DetailedBreakdownProps) {
    // Mock data for detailed breakdown
    // In the future, this will be fetched via /exams/performance/topics
    const detailedTopics = [
        {
            category: 'Algebra',
            score: 85,
            totalItems: 42,
            avgTime: '1m 20s',
            status: 'Strong',
            weakness: null,
            subtopics: [
                { name: 'Quadratic Equations', accuracy: 92 },
                { name: 'Polynomials', accuracy: 78 }
            ]
        },
        {
            category: 'Geometry',
            score: 40,
            totalItems: 35,
            avgTime: '2m 10s',
            status: 'Weak',
            weakness: 'Circle Theorems',
            subtopics: [
                { name: 'Triangles', accuracy: 55 },
                { name: 'Circles', accuracy: 25 }
            ]
        },
        {
            category: 'Trigonometry',
            score: 70,
            totalItems: 28,
            avgTime: '1m 45s',
            status: 'Average',
            weakness: 'Identities',
            subtopics: [
                { name: 'Heights & Distances', accuracy: 80 },
                { name: 'Inverse Trig', accuracy: 60 }
            ]
        },
        {
            category: 'Probability',
            score: 90,
            totalItems: 20,
            avgTime: '45s',
            status: 'Strong',
            weakness: null,
            subtopics: [
                { name: 'Bayes Theorem', accuracy: 88 },
                { name: 'Events', accuracy: 92 }
            ]
        }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-[#00bfa5]" /> Subject Mastery Breakdown
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">Granular analysis of your performance across all topics.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Content Scrollable */}
                    <div className="p-8 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">
                        {detailedTopics.map((topic, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                            >
                                <div className="flex items-start md:items-center justify-between gap-6 flex-col md:flex-row mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${topic.score >= 80 ? 'bg-emerald-100 text-emerald-600' :
                                                topic.score >= 60 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {topic.score}%
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#00bfa5] transition-colors">{topic.category}</h3>
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {topic.totalItems} Qs</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {topic.avgTime} avg</span>
                                            </div>
                                        </div>
                                    </div>

                                    {topic.weakness ? (
                                        <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-amber-700 text-xs font-bold">
                                            <AlertTriangle className="w-4 h-4" />
                                            Needs focus on: {topic.weakness}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Mastery Achieved
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gray-100 mb-6" />

                                {/* Subtopics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {topic.subtopics.map((sub, sIdx) => (
                                        <div key={sIdx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
                                            <span className="text-sm font-bold text-slate-600">{sub.name}</span>
                                            <div className="flex items-center gap-3 w-1/2">
                                                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${sub.accuracy >= 80 ? 'bg-emerald-500' : sub.accuracy >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${sub.accuracy}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 w-8 text-right">{sub.accuracy}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

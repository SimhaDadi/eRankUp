'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Trash2,
    Plus,
    CheckCircle2,
    ChevronRight,
    HelpCircle,
    BookOpen,
    Layout
} from 'lucide-react';
import api from '@/lib/api';

export default function NewExamPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [examData, setExamData] = useState({
        title: '',
        description: '',
        isActive: true,
        defaultPositiveMarks: 1.0,
        defaultNegativeMarks: 0.25,
        type: 'real_exam' // Default to real exam
    });

    const [chapters, setChapters] = useState<any[]>([]);
    const [currentChapter, setCurrentChapter] = useState({ title: '', description: '' });

    const handleCreateExam = async () => {
        if (!examData.title) return alert('Title is required');
        try {
            const response = await api.post('/exams', examData);
            const exam = response.data;

            // If we have chapters, add them too
            try {
                for (const chapter of chapters) {
                    await api.post(`/exams/${exam.id}/chapters`, chapter);
                }
            } catch (err) {
                console.warn("Failed to create initial chapters", err);
                // Proceed anyway
            }

            router.push(`/admin/exams/${exam.id}`);
        } catch (error) {
            console.error(error);
            alert('Failed to create exam');
        }
    };

    const addChapter = () => {
        if (!currentChapter.title) return;
        setChapters([...chapters, currentChapter]);
        setCurrentChapter({ title: '', description: '' });
    };

    const removeChapter = (index: number) => {
        setChapters(chapters.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            {/* Back Link */}
            <button
                onClick={() => router.push('/admin/exams')}
                className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Exams
            </button>

            {/* Progress Bar */}
            <div className="flex items-center gap-4 mb-10">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                            }`}>
                            {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-20 h-1 rounded-full ${step > s ? 'bg-blue-600' : 'bg-slate-800'}`} />}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
                            <p className="text-slate-400">Set the title and general description for this examination.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Exam Title</label>
                                <input
                                    type="text"
                                    value={examData.title}
                                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                    placeholder="e.g. SSC CGL 2024 - Tier I"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                            </div>

                            {/* Exam Type Selector */}
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setExamData({ ...examData, type: 'real_exam' })}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${examData.type === 'real_exam'
                                            ? 'bg-blue-600/10 border-blue-600 text-blue-400'
                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                    >
                                        <BookOpen className="w-5 h-5" />
                                        <div className="text-left">
                                            <div className="font-bold">Real Exam</div>
                                            <div className="text-xs opacity-70">For students to attempt</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setExamData({ ...examData, type: 'question_bank' })}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${examData.type === 'question_bank'
                                            ? 'bg-purple-600/10 border-purple-600 text-purple-400'
                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                    >
                                        <Layout className="w-5 h-5" />
                                        <div className="text-left">
                                            <div className="font-bold">Question Bank</div>
                                            <div className="text-xs opacity-70">Repository for questions</div>
                                        </div>
                                    </button>
                                </div>
                            </div>


                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={examData.description}
                                    onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                                    placeholder="Provide a brief overview of the exam syllabus and target audience..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[150px] focus:ring-2 focus:ring-blue-500/50 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Positive Marks</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={examData.defaultPositiveMarks}
                                        onChange={(e) => setExamData({ ...examData, defaultPositiveMarks: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/50 outline-none text-emerald-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Negative Marks</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={examData.defaultNegativeMarks}
                                        onChange={(e) => setExamData({ ...examData, defaultNegativeMarks: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-red-500/50 outline-none text-red-500 font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-8"
                        >
                            Continue to Chapters <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Structure Chapters</h2>
                            <p className="text-slate-400">Divide the exam into logical sections or subjects.</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Chapter Title</label>
                                <input
                                    type="text"
                                    value={currentChapter.title}
                                    onChange={(e) => setCurrentChapter({ ...currentChapter, title: e.target.value })}
                                    placeholder="e.g. Quantitative Aptitude"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={addChapter}
                                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Chapter to List
                            </button>
                        </div>

                        <div className="space-y-3">
                            {chapters.map((ch, idx) => (
                                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-bold">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium">{ch.title}</span>
                                    </div>
                                    <button onClick={() => removeChapter(idx)} className="text-slate-500 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {chapters.length === 0 && (
                                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                                    No chapters added yet.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 font-bold py-4 rounded-xl transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={chapters.length === 0}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold py-4 rounded-xl transition-all"
                            >
                                Finalize
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-center space-y-8 py-10"
                    >
                        <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Almost Ready!</h2>
                            <p className="text-slate-400">
                                Review your exam structure. Once created, you can add Mock Tests and Questions manually from the dashboard.
                            </p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left max-w-md mx-auto">
                            <div className="font-bold text-lg mb-1">{examData.title}</div>
                            <div className="text-sm text-slate-500 mb-4">{examData.description}</div>
                            <div className="space-y-2">
                                {chapters.map((ch, idx) => (
                                    <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> {ch.title}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                                <span className="uppercase tracking-widest font-bold">Type</span>
                                <span className={`font-bold px-2 py-1 rounded ${examData.type === 'question_bank' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {examData.type === 'question_bank' ? 'Question Bank' : 'Real Exam'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleCreateExam}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                <Save className="w-5 h-5" /> Launch Examination
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="text-slate-500 hover:text-white font-medium text-sm transition-colors"
                            >
                                Go Back and Edit
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface ReportQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    questionId: string;
    questionContent: string;
}

const REPORT_TYPES = [
    { id: 'INCORRECT_ANSWER', label: 'Wrong Answer' },
    { id: 'UNCLEAR_QUESTION', label: 'Incomplete/Wrong Question' },
    { id: 'TYPO', label: 'Formatting/Image Issue' },
    { id: 'OFFENSIVE_CONTENT', label: 'Explanation Issue' }, // Map to Offensive/Explanation logic if needed, or stick to backend enum
    { id: 'OTHER', label: 'Other' },
];

export default function ReportQuestionModal({ isOpen, onClose, questionId, questionContent }: ReportQuestionModalProps) {
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!type) {
            setError('Please select an issue type');
            return;
        }
        if (description.length < 10) {
            setError('Please provide a bit more detail (min 10 characters)');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.post(`/quality/flag/${questionId}`, {
                type,
                description
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset after closing
                setTimeout(() => {
                    setIsSuccess(false);
                    setType('');
                    setDescription('');
                }, 300);
            }, 2000);
        } catch (err: any) {
            console.error('Failed to report question:', err);
            setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-slate-900/5 focus:outline-none"
                    >
                        {/* Header Image/Pattern */}
                        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-indigo-600 to-violet-700 opacity-10 pointer-events-none" />

                        <div className="p-8 pb-4 relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                                    <Flag className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Report Issue</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Help us improve eRankUp</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {isSuccess ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-12 text-center"
                            >
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 mb-2">Thank You!</h4>
                                <p className="text-slate-500 font-medium">Your report has been received. Our team will review the question shortly.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                                {/* Question Context (Optional/Small) */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-h-24 overflow-y-auto">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                                        Question Snippet
                                        <span className="font-mono text-slate-300">#{questionId.slice(0, 8)}</span>
                                    </p>
                                    <div className="text-[12px] font-bold text-slate-600 leading-relaxed truncate">
                                        {questionContent.replace(/<[^>]*>?/gm, '')}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">What's wrong?</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {REPORT_TYPES.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setType(r.id)}
                                                className={`px-4 py-3 rounded-xl border text-[11px] font-bold text-left transition-all duration-200 ${type === r.id
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Describe the issue</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Please provide more details about the error..."
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none placeholder:text-slate-300"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 text-[11px] font-bold animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-4 bg-slate-50 text-slate-500 font-black text-[11px] uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] py-4 bg-[#0f172a] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                SUBMITTING...
                                            </>
                                        ) : (
                                            'SUBMIT REPORT'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import api from '@/lib/api';
import MathRenderer from '../common/MathRenderer';

interface EditQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    question: any;
}

export default function EditQuestionModal({ isOpen, onClose, onSuccess, question }: EditQuestionModalProps) {
    const [questionData, setQuestionData] = useState({
        content: '',
        imageUrl: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        difficultyWeight: 0.5,
        positiveMarks: 1,
        negativeMarks: 0.25,
        explanation: '',
        topic: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (question && isOpen) {
            // Map existing question data to state
            const optionsText = question.options?.map((o: any) => o.text) || ['', '', '', ''];

            // Find correct index (A=0, B=1...)
            let correctIdx = 0;
            if (question.correctOptionId) {
                correctIdx = question.correctOptionId.charCodeAt(0) - 65;
            }

            setQuestionData({
                content: question.content || '',
                imageUrl: question.imageUrl || '',
                options: optionsText,
                correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
                difficultyWeight: question.difficultyWeight || 0.5,
                positiveMarks: question.positiveMarks || 1,
                negativeMarks: question.negativeMarks || 0.25,
                explanation: question.explanation || '',
                topic: question.topic || ''
            });
        }
    }, [question, isOpen]);

    const handleSubmit = async () => {
        if (!questionData.content) {
            alert("Question text is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                questionText: questionData.content,
                imageUrl: questionData.imageUrl,
                options: questionData.options, // Backend now accepts array of strings
                correctAnswer: questionData.correctOptionIndex,
                difficultyWeight: questionData.difficultyWeight,
                difficulty: questionData.difficultyWeight < 0.4 ? 'easy' : questionData.difficultyWeight > 0.6 ? 'hard' : 'medium', // Controller maps back
                explanation: questionData.explanation,
                topic: questionData.topic,
                positiveMarks: questionData.positiveMarks,
                negativeMarks: questionData.negativeMarks
            };

            await api.patch(`/questions/${question.id}`, payload);
            alert("Question updated successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update question", error);
            alert("Failed to update question.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#0f172a] border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white">Edit Question</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                            {/* Topic */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topic</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    value={questionData.topic}
                                    onChange={e => setQuestionData({ ...questionData, topic: e.target.value })}
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question Text (Markdown/LaTeX)</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white focus:border-blue-500 outline-none min-h-[120px] font-mono"
                                    value={questionData.content}
                                    onChange={e => setQuestionData({ ...questionData, content: e.target.value })}
                                    placeholder="Enter question text. Use $ ... $ for LaTeX math."
                                />

                                {questionData.content && (
                                    <div className="mt-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Live Preview</label>
                                        <MathRenderer
                                            content={questionData.content}
                                            className="text-white text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Image URL (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600"
                                    value={questionData.imageUrl}
                                    onChange={e => setQuestionData({ ...questionData, imageUrl: e.target.value })}
                                />
                                {questionData.imageUrl && (
                                    <div className="mt-2 p-2 bg-slate-900 rounded-xl border border-dashed border-slate-700 flex justify-center">
                                        <Image
                                            src={questionData.imageUrl}
                                            alt="Preview"
                                            width={192}
                                            height={192}
                                            className="max-h-48 rounded-lg object-contain"
                                            unoptimized
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Options</label>
                                {questionData.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div
                                            className={`w-10 flex items-center justify-center rounded-lg border cursor-pointer transition-colors ${questionData.correctOptionIndex === idx ? 'bg-green-500/20 border-green-500 text-green-500 font-bold' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                            onClick={() => setQuestionData({ ...questionData, correctOptionIndex: idx })}
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <input
                                            type="text"
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...questionData.options];
                                                newOpts[idx] = e.target.value;
                                                setQuestionData({ ...questionData, options: newOpts });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Explanation */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Explanation</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none min-h-[80px]"
                                    value={questionData.explanation}
                                    onChange={e => setQuestionData({ ...questionData, explanation: e.target.value })}
                                />
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Difficulty (0-1)</label>
                                    <input
                                        type="number" step="0.1" min="0" max="1"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        value={questionData.difficultyWeight}
                                        onChange={e => setQuestionData({ ...questionData, difficultyWeight: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Positive Marks</label>
                                    <input
                                        type="number" step="0.5"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        value={questionData.positiveMarks}
                                        onChange={e => setQuestionData({ ...questionData, positiveMarks: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Negative Marks</label>
                                    <input
                                        type="number" step="0.25"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        value={questionData.negativeMarks}
                                        onChange={e => setQuestionData({ ...questionData, negativeMarks: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                            </button>
                        </div>
                    </motion.div>
                </div >
            )}
        </AnimatePresence>
    );
}

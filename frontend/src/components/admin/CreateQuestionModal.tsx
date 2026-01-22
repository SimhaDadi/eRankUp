import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface CreateQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preSelectedExamId?: string;
    preSelectedModelId?: string;
}

export default function CreateQuestionModal({ isOpen, onClose, onSuccess, preSelectedExamId, preSelectedModelId }: CreateQuestionModalProps) {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState(preSelectedExamId || '');
    const [extraExams, setExtraExams] = useState<string[]>([]);
    const [selectedChapter, setSelectedChapter] = useState('');
    const [selectedModel, setSelectedModel] = useState(preSelectedModelId || '');

    // Derived state for dependent dropdowns
    const currentExam = exams.find(e => e.id === selectedExam);
    const chapters = currentExam?.chapters || [];
    const models = selectedChapter ? chapters.find((c: any) => c.id === selectedChapter)?.models || [] : [];


    const [questionData, setQuestionData] = useState({
        content: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        difficultyWeight: 0.5,
        positiveMarks: 2,
        negativeMarks: 0.5,
        explanation: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchExams();
        }
    }, [isOpen]);

    // Handle pre-selection updates when data loads
    useEffect(() => {
        if (exams.length > 0 && preSelectedExamId) {
            console.log(`[DEBUG] Attempting auto-select. ExamID: ${preSelectedExamId}, ModelID: ${preSelectedModelId}`);
            setSelectedExam(preSelectedExamId);

            if (preSelectedModelId) {
                const exam = exams.find(e => e.id === preSelectedExamId);
                console.log(`[DEBUG] Found Exam:`, exam ? 'Yes' : 'No');

                if (exam) {
                    // Check structure
                    console.log(`[DEBUG] Exam models count: ${exam.models?.length}`);
                    console.log(`[DEBUG] Exam chapters count: ${exam.chapters?.length}`);

                    // 1. Try finding in flat models list
                    const model = exam.models?.find((m: any) => m.id === preSelectedModelId);
                    console.log(`[DEBUG] Found Model (flat):`, model ? 'Yes' : 'No', model);

                    if (model?.chapter) {
                        console.log(`[DEBUG] Found Chapter from flat model:`, model.chapter);
                        setSelectedChapter(model.chapter.id);
                        setSelectedModel(preSelectedModelId);
                        return;
                    }

                    // 2. Fallback: Try finding in nested chapters
                    if (exam.chapters) {
                        const chapterFromGroup = exam.chapters.find((c: any) => c.models?.some((m: any) => m.id === preSelectedModelId));
                        console.log(`[DEBUG] Found Chapter (nested):`, chapterFromGroup ? 'Yes' : 'No');

                        if (chapterFromGroup) {
                            setSelectedChapter(chapterFromGroup.id);
                            setSelectedModel(preSelectedModelId);
                        }
                    }
                }
            }
        }
    }, [exams, preSelectedExamId, preSelectedModelId]);

    const fetchExams = async () => {
        try {
            const response = await api.get('/exams');
            setExams(response.data);
        } catch (error) {
            console.error("Failed to fetch hierarchy", error);
        }
    };

    const handleSubmit = async () => {
        if (!selectedModel || !questionData.content) {
            alert("Please fill all required fields and select a target Model.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Transform to backend DTO format
            // Backend expects options as {id: string, text: string}[] and correctOptionId
            const transformedOptions = questionData.options.map((opt, idx) => ({
                id: String.fromCharCode(97 + idx), // 'a', 'b', 'c'...
                text: opt
            }));

            const payload = {
                questions: [{
                    content: questionData.content,
                    options: transformedOptions,
                    correctOptionId: transformedOptions[questionData.correctOptionIndex]?.id,
                    difficultyWeight: questionData.difficultyWeight,
                    positiveMarks: questionData.positiveMarks,
                    negativeMarks: questionData.negativeMarks,
                    explanation: questionData.explanation,
                    exams: [selectedExam, ...extraExams].filter(id => !!id).map(id => ({ id }))
                }]
            };

            await api.post(`/exams/models/${selectedModel}/questions/bulk`, payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create question", error);
            alert("Failed to create question. Check console.");
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
                            <h2 className="text-xl font-bold text-white">Add New Question</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Hierarchy Selection */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        value={selectedExam}
                                        onChange={e => setSelectedExam(e.target.value)}
                                    >
                                        <option value="">Primary Exam</option>
                                        {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Also Add to Exams</label>
                                    <div className="flex flex-wrap gap-2">
                                        {exams.filter(e => e.id !== selectedExam).map(e => (
                                            <button
                                                key={e.id}
                                                onClick={() => {
                                                    setExtraExams(prev =>
                                                        prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id]
                                                    );
                                                }}
                                                className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold border transition-all ${extraExams.includes(e.id)
                                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                                    }`}
                                            >
                                                {e.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chapter</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        disabled={!selectedExam}
                                        value={selectedChapter}
                                        onChange={e => setSelectedChapter(e.target.value)}
                                    >
                                        <option value="">Select Chapter</option>
                                        {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Model</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        disabled={!selectedChapter}
                                        value={selectedModel}
                                        onChange={e => setSelectedModel(e.target.value)}
                                    >
                                        <option value="">Select Model</option>
                                        {models.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
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
                                            placeholder={`Option ${idx + 1}`}
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
                                {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Question</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

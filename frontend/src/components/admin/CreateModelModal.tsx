
import { useState, useEffect } from 'react';
import { X, Save, Layers, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface CreateModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    examId: string;
}

export default function CreateModelModal({ isOpen, onClose, onSuccess, examId }: CreateModelModalProps) {
    const [step, setStep] = useState(1);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        chapterId: '',
        totalQuestions: 0,
        duration: 60,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchHierarchy();
        }
    }, [isOpen]);

    const fetchHierarchy = async () => {
        setIsLoadingHierarchy(true);
        try {
            const res = await api.get('/exams/subjects/all');
            setSubjects(res.data);
        } catch (error) {
            console.error(error);
            alert('Failed to load subjects');
        } finally {
            setIsLoadingHierarchy(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.chapterId) return alert('Please select a chapter');

        setIsSubmitting(true);
        try {
            // Post to create model in chapter, linking to this exam
            await api.post(`/exams/chapters/${formData.chapterId}/models`, {
                title: formData.title,
                totalQuestions: Number(formData.totalQuestions),
                scheduledAt: new Date(),
                exams: [{ id: examId }] // Critical: Link to current exam
            });
            onSuccess();
            onClose();
            // Reset form
            setFormData({ title: '', chapterId: '', totalQuestions: 0, duration: 60 });
            setStep(1);
            setSelectedSubjectId('');
        } catch (error) {
            console.error(error);
            alert('Failed to create test model');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentSubject = subjects.find(s => s.id === selectedSubjectId);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto shadow-2xl shadow-black/50">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-cyan-500" />
                                    {step === 1 ? 'Select Location' : 'Configure Test'}
                                </h3>
                                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {step === 1 ? (
                                <div className="p-6 space-y-4 overflow-y-auto">
                                    {isLoadingHierarchy ? <div className="text-center p-4 text-slate-500">Loading hierarchy...</div> : (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Subject</label>
                                                <select
                                                    value={selectedSubjectId}
                                                    onChange={(e) => {
                                                        setSelectedSubjectId(e.target.value);
                                                        setFormData({ ...formData, chapterId: '' });
                                                    }}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-cyan-500/50 outline-none text-white appearance-none"
                                                >
                                                    <option value="" disabled>Select Subject</option>
                                                    {subjects.map(s => (
                                                        <option key={s.id} value={s.id}>{s.title}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {currentSubject && (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Chapter</label>
                                                    <select
                                                        value={formData.chapterId}
                                                        onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-cyan-500/50 outline-none text-white appearance-none"
                                                    >
                                                        <option value="" disabled>Select Chapter</option>
                                                        {currentSubject.chapters?.map((ch: any) => (
                                                            <option key={ch.id} value={ch.id}>{ch.title}</option>
                                                        ))}
                                                    </select>
                                                    {(!currentSubject.chapters || currentSubject.chapters.length === 0) && (
                                                        <div className="text-rose-500 text-sm mt-2">No chapters in this subject.</div>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setStep(2)}
                                                disabled={!formData.chapterId}
                                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all"
                                            >
                                                Next Step <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Test Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Mock Test 1 - Mastery"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-cyan-500/50 outline-none placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Duration (Mins)</label>
                                            <input
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Qs Expected</label>
                                            <input
                                                type="number"
                                                value={formData.totalQuestions}
                                                onChange={(e) => setFormData({ ...formData, totalQuestions: Number(e.target.value) })}
                                                placeholder="Auto"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                                        >
                                            {isSubmitting ? 'Creating...' : (
                                                <>
                                                    <Save className="w-5 h-5" /> Create Test Module
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

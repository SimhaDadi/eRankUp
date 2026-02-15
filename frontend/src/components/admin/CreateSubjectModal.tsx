import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Book, Upload } from 'lucide-react';
import api from '@/lib/api';

interface CreateSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    examId: string;
}

export default function CreateSubjectModal({ isOpen, onClose, onSuccess, examId }: CreateSubjectModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'book'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!formData.title) return;

        setIsSubmitting(true);
        try {
            await api.post('/exams/subjects', {
                ...formData,
                examId
            });
            onSuccess();
            onClose();
            setFormData({ title: '', description: '', icon: 'book' });
        } catch (error) {
            console.error("Failed to create subject", error);
            alert("Failed to create subject.");
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
                        className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Book className="w-5 h-5 text-cyan-500" />
                                New Subject
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                    placeholder="e.g. Quantitative Aptitude"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none h-24 resize-none"
                                    placeholder="Brief description of the subject..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Icon Key</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                    placeholder="lucide-react icon name (default: book)"
                                    value={formData.icon}
                                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                />
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
                                disabled={isSubmitting || !formData.title}
                                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Subject'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

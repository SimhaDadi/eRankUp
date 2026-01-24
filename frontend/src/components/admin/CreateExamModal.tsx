'use client';

import { useState } from 'react';
import { X, Loader2, Plus, Library, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { EXAM_CATEGORIES } from '@erankup/shared';

interface CreateExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (examId: string) => void;
}

export function CreateExamModal({ isOpen, onClose, onSuccess }: CreateExamModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'SSC',
        type: 'real_exam',
        defaultPositiveMarks: 1,
        defaultNegativeMarks: 0.25,
        startTime: '',
        endTime: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Exam title is required';
        }
        if (formData.defaultPositiveMarks <= 0) {
            newErrors.defaultPositiveMarks = 'Positive marks must be greater than 0';
        }
        if (formData.defaultNegativeMarks < 0) {
            newErrors.defaultNegativeMarks = 'Negative marks cannot be negative';
        }
        if (formData.type === 'live_exam') {
            if (!formData.startTime) newErrors.startTime = 'Start time is required';
            if (!formData.endTime) newErrors.endTime = 'End time is required';
            if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
                newErrors.endTime = 'End time must be after start time';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/exams', formData);
            onSuccess(res.data.id);
            onClose();
            // Reset form
            setFormData({
                title: '',
                description: '',
                category: 'SSC',
                type: 'real_exam',
                defaultPositiveMarks: 1,
                defaultNegativeMarks: 0.25,
                startTime: '',
                endTime: ''
            });
            setErrors({});
        } catch (error: any) {
            console.error('Error creating exam:', error);
            setErrors({ submit: error.response?.data?.message || 'Failed to create exam' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create New Exam</h2>
                            <p className="text-sm text-gray-600 mt-0.5">Set up basic exam details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Exam Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Exam Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g., SSC CGL 2024 Mock Test 1"
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder-gray-400 ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                        />
                        {errors.title && (
                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                <span>⚠</span> {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Provide a brief overview of the exam syllabus and target audience..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 bg-white"
                        >
                            {EXAM_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Live Exam Schedule */}
                    <AnimatePresence>
                        {formData.type === 'live_exam' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="grid grid-cols-2 gap-4 overflow-hidden"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startTime}
                                        onChange={(e) => handleChange('startTime', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endTime}
                                        onChange={(e) => handleChange('endTime', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Exam Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Exam Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => handleChange('type', 'real_exam')}
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-[10px] flex flex-col items-center gap-1 ${formData.type === 'real_exam'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                Real Exam
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('type', 'live_exam')}
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-[10px] flex flex-col items-center gap-1 ${formData.type === 'live_exam'
                                    ? 'border-rose-600 bg-rose-50 text-rose-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <Zap className="w-4 h-4" />
                                Live
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('type', 'previous_year_paper')}
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-[10px] flex flex-col items-center gap-1 ${formData.type === 'previous_year_paper'
                                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <Library className="w-4 h-4" />
                                PYP
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('type', 'question_bank')}
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-[10px] flex flex-col items-center gap-1 ${formData.type === 'question_bank'
                                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <Library className="w-4 h-4" />
                                Bank
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic px-1">
                            {formData.type === 'real_exam'
                                ? 'Assignable to students. Appears in Test Series Hub.'
                                : formData.type === 'live_exam'
                                    ? 'Scheduled event. Only accessible during specified window.'
                                    : formData.type === 'previous_year_paper'
                                        ? 'Official past papers. Used for practice and reference.'
                                        : 'A repository of questions used as a source for other exams.'}
                        </p>
                    </div>

                    {/* Marking Scheme */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Positive Marks <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.25"
                                min="0"
                                value={formData.defaultPositiveMarks}
                                onChange={(e) => handleChange('defaultPositiveMarks', parseFloat(e.target.value))}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Negative Marks
                            </label>
                            <input
                                type="number"
                                step="0.25"
                                min="0"
                                value={formData.defaultNegativeMarks}
                                onChange={(e) => handleChange('defaultNegativeMarks', parseFloat(e.target.value))}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Create Exam
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Edit, Plus, Library, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface EditExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: any;
    onSuccess: () => void;
}

export function EditExamModal({ isOpen, onClose, exam, onSuccess }: EditExamModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'real_exam',
        defaultPositiveMarks: 1,
        defaultNegativeMarks: 0.25,
        duration: 60,
        isPremium: false,
        videoSolutionUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (exam) {
            setFormData({
                title: exam.title || '',
                description: exam.description || '',
                type: exam.type || 'real_exam',
                defaultPositiveMarks: exam.defaultPositiveMarks || 1,
                defaultNegativeMarks: exam.defaultNegativeMarks || 0.25,
                duration: exam.duration || 60,
                category: (exam as any).category || '',
                startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
                endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
                isPremium: exam.isPremium || false,
                videoSolutionUrl: exam.videoSolutionUrl || ''
            } as any);
        }
    }, [exam]);

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

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            await api.put(`/exams/${exam.id}`, formData);
            onSuccess();
            onClose();
            setErrors({});
        } catch (error: any) {
            console.error('Error updating exam:', error);
            setErrors({ submit: error.response?.data?.message || 'Failed to update exam' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (!isOpen || !exam) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Edit className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Edit Exam Details</h2>
                            <p className="text-sm text-gray-600 mt-0.5">Update exam configuration</p>
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
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Exam Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Exam Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder-gray-400 ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                        />
                        {errors.title && (
                            <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Category Field - NEW */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category (Exam Name)
                        </label>
                        <input
                            type="text"
                            value={(formData as any).category || ''}
                            onChange={(e) => handleChange('category', e.target.value)}
                            placeholder="e.g. SSC CGL"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    {/* Live Exam Schedule */}
                    {(formData.type === 'live_exam' || (formData as any).startTime) && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={(formData as any).startTime || ''}
                                    onChange={(e) => handleChange('startTime', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={(formData as any).endTime || ''}
                                    onChange={(e) => handleChange('endTime', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 bg-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Premium Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${formData.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                                <Zap className={`w-5 h-5 ${formData.isPremium ? 'fill-amber-600' : ''}`} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Premium Content</h4>
                                <p className="text-[10px] text-gray-500">Requires a valid pass or purchase to access</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleChange('isPremium', !formData.isPremium)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isPremium ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`${formData.isPremium ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    {/* Video Solution URL */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Video Solution URL <span className="text-xs text-gray-400 font-normal">(YouTube/Vimeo link)</span>
                        </label>
                        <input
                            type="url"
                            value={(formData as any).videoSolutionUrl || ''}
                            onChange={(e) => handleChange('videoSolutionUrl', e.target.value)}
                            placeholder="https://youtu.be/..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    {/* Exam Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Exam Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                                type="button"
                                onClick={() => handleChange('type', 'real_exam')}
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-xs flex flex-col items-center gap-1 ${formData.type === 'real_exam'
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
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-xs flex flex-col items-center gap-1 ${formData.type === 'live_exam'
                                    ? 'border-red-600 bg-red-50 text-red-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                                Live Exam
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('type', 'previous_year_paper')}
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-xs flex flex-col items-center gap-1 ${formData.type === 'previous_year_paper'
                                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                PYP
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('type', 'question_bank')}
                                className={`px-2 py-3 rounded-xl border-2 font-bold transition-all text-xs flex flex-col items-center gap-1 ${formData.type === 'question_bank'
                                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <Library className="w-4 h-4" />
                                Bank
                            </button>
                        </div>
                    </div>

                    {/* Marking Scheme & Duration */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Duration (Min) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.duration}
                                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>
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
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Edit className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface Model {
    id: string;
    title: string;
    totalQuestions: number;
    hierarchy: string;
}

interface Question {
    id: string;
    content: string;
    topic: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
}

interface QuestionBankBrowserProps {
    examId: string;
    onClose: () => void;
    onQuestionsLinked: () => void;
}

export function QuestionBankBrowser({ examId, onClose, onQuestionsLinked }: QuestionBankBrowserProps) {
    const [models, setModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exams/question-bank/models');
            setModels(res.data);
        } catch (error) {
            console.error('Error fetching models:', error);
            alert('Failed to load question banks');
        } finally {
            setLoading(false);
        }
    };

    const handleModelSelect = async (model: Model) => {
        setSelectedModel(model);
        setLoading(true);
        setSelectedQuestions(new Set());
        try {
            const res = await api.get(`/exams/question-bank/models/${model.id}/questions`);
            setQuestions(res.data);
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestion = (questionId: string) => {
        const newSet = new Set(selectedQuestions);
        if (newSet.has(questionId)) {
            newSet.delete(questionId);
        } else {
            newSet.add(questionId);
        }
        setSelectedQuestions(newSet);
    };

    const toggleAll = () => {
        if (selectedQuestions.size === filteredQuestions.length) {
            setSelectedQuestions(new Set());
        } else {
            setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
        }
    };

    const handleLinkQuestions = async () => {
        if (selectedQuestions.size === 0) return;

        setLinking(true);
        try {
            const res = await api.post(`/exams/${examId}/link-questions`, {
                questionIds: Array.from(selectedQuestions)
            });
            alert(`Successfully linked ${res.data.linked} questions! (${res.data.skipped} already linked)`);
            onQuestionsLinked();
            onClose();
        } catch (error) {
            console.error('Error linking questions:', error);
            alert('Failed to link questions');
        } finally {
            setLinking(false);
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Browse Question Bank</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Select questions from your question banks to add to this exam
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Models List */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <h3 className="font-semibold text-gray-900 mb-2">Question Banks</h3>
                            <p className="text-xs text-gray-500">{models.length} models available</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loading && !selectedModel ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : models.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p className="font-medium">No question banks found</p>
                                    <p className="text-sm mt-1">Create a question bank first in Content Hierarchy</p>
                                </div>
                            ) : (
                                models.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => handleModelSelect(model)}
                                        className={`w-full text-left p-4 rounded-xl transition-all ${selectedModel?.id === model.id
                                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                                : 'bg-white hover:bg-blue-50 border border-gray-200'
                                            }`}
                                    >
                                        <h4 className={`font-semibold mb-1 ${selectedModel?.id === model.id ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {model.title}
                                        </h4>
                                        <p className={`text-xs mb-2 ${selectedModel?.id === model.id ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {model.hierarchy}
                                        </p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedModel?.id === model.id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {model.totalQuestions} questions
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Questions List */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedModel ? (
                            <>
                                {/* Search & Select All */}
                                <div className="p-4 border-b border-gray-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">
                                            {selectedModel.title} Questions
                                        </h3>
                                        <button
                                            onClick={toggleAll}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            {selectedQuestions.size === filteredQuestions.length ? (
                                                <>
                                                    <CheckSquare className="w-4 h-4" />
                                                    Deselect All
                                                </>
                                            ) : (
                                                <>
                                                    <Square className="w-4 h-4" />
                                                    Select All
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search questions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Questions List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        </div>
                                    ) : filteredQuestions.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <p className="font-medium">No questions found</p>
                                            <p className="text-sm mt-1">
                                                {searchTerm ? 'Try a different search term' : 'This model has no questions yet'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredQuestions.map((question, index) => (
                                            <div
                                                key={question.id}
                                                onClick={() => toggleQuestion(question.id)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedQuestions.has(question.id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1">
                                                        {selectedQuestions.has(question.id) ? (
                                                            <CheckSquare className="w-5 h-5 text-blue-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <span className="text-xs font-medium text-gray-500">Q{index + 1}</span>
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                                                {question.topic}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-900 font-medium mb-3">{question.content}</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {question.options.map(option => (
                                                                <div
                                                                    key={option.id}
                                                                    className={`text-sm px-3 py-2 rounded-lg ${option.id === question.correctOptionId
                                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                                            : 'bg-gray-50 text-gray-700'
                                                                        }`}
                                                                >
                                                                    <span className="font-semibold">{option.id}.</span> {option.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium">Select a model to view questions</p>
                                    <p className="text-sm mt-1">Choose from the question banks on the left</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {selectedQuestions.size > 0 ? (
                            <span className="font-medium text-blue-600">
                                {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
                            </span>
                        ) : (
                            <span>No questions selected</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleLinkQuestions}
                            disabled={selectedQuestions.size === 0 || linking}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {linking ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Linking...
                                </>
                            ) : (
                                <>
                                    Link {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

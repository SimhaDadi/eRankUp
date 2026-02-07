'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Plus,
    BookOpen,
    Trash2,
    Edit,
    CheckCircle2,
    AlertTriangle,
    Library,
    Hash,
    MoreVertical,
    X,
    Loader2,
    Upload
} from 'lucide-react';
import api from '@/lib/api';
import { QuestionBankBrowser } from '@/components/admin/QuestionBankBrowser';
import UploadExamQuestionsModal from '@/components/admin/UploadExamQuestionsModal';
import { EditExamModal } from '@/components/admin/EditExamModal';
import { SafeHtml } from '@/components/SafeHtml';

interface Question {
    id: string;
    content: string;
    type: string;
    options?: any[];
    correctOptionId?: string;
    topic?: string;
    subtopic?: string;
    difficultyWeight?: number;
}

interface Exam {
    id: string;
    title: string;
    description: string;
    questions?: Question[];
    defaultPositiveMarks: number;
    defaultNegativeMarks: number;
    type: 'real_exam' | 'question_bank';
}

export default function ExamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [exam, setExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showQuestionBrowser, setShowQuestionBrowser] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [removingQuestionId, setRemovingQuestionId] = useState<string | null>(null);

    const fetchExamDetails = async () => {
        try {
            const response = await api.get(`/exams/${params.id}`);
            setExam(response.data);
        } catch (error) {
            console.error("Failed to fetch exam details", error);
            // Handle 404
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExamDetails();
    }, [params.id]);

    const handleRemoveQuestion = async (questionId: string) => {
        if (!exam) return;
        if (!confirm('Are you sure you want to remove this question from the exam?')) return;

        setRemovingQuestionId(questionId);
        try {
            await api.delete(`/exams/${exam.id}/unlink-questions`, {
                data: { questionIds: [questionId] }
            });
            // Optimistic update
            setExam(prev => prev ? ({
                ...prev,
                questions: prev.questions?.filter(q => q.id !== questionId)
            }) : null);
        } catch (error) {
            console.error('Failed to unlink question', error);
            alert('Failed to remove question. Please try again.');
        } finally {
            setRemovingQuestionId(null);
        }
    };

    const handleDeleteExam = async () => {
        if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
        try {
            await api.delete(`/exams/${params.id}`);
            router.push('/admin/exams');
        } catch (error) {
            console.error('Failed to delete exam', error);
            alert('Failed to delete exam');
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    if (!exam) return <div className="p-12 text-center text-rose-400 font-bold">Exam not found</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Navigation */}
            <button
                onClick={() => router.push('/admin/exams')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Exams
            </button>

            {/* Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 opacity-50"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-3xl font-bold text-white">{exam.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${exam.type === 'question_bank'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                {exam.type === 'question_bank' ? 'QUESTION BANK' : 'REAL EXAM'}
                            </span>
                        </div>
                        <p className="text-slate-400 max-w-2xl text-lg leading-relaxed mb-6">
                            {exam.description || 'No description provided.'}
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-medium text-slate-300">
                                    Correct: <span className="text-emerald-400 font-bold">+{exam.defaultPositiveMarks}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                                <span className="text-sm font-medium text-slate-300">
                                    Incorrect: <span className="text-rose-400 font-bold">-{exam.defaultNegativeMarks}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium text-slate-300">
                                    Questions: <span className="text-blue-400 font-bold">{exam.questions?.length || 0}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700"
                            title="Edit Exam Details"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDeleteExam}
                            className="p-3 bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 rounded-xl transition-colors border border-slate-700 hover:border-rose-500/30"
                            title="Delete Exam"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Questions Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Library className="w-6 h-6 text-blue-500" />
                        Linked Questions
                    </h2>

                    <button
                        onClick={() => setShowQuestionBrowser(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Browse Question Bank
                    </button>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all ml-3"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Questions
                    </button>
                </div>

                {!exam.questions || exam.questions.length === 0 ? (
                    <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-16 text-center">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No questions linked yet</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Browse the global question bank to find and link questions to this exam.
                        </p>
                        <button
                            onClick={() => setShowQuestionBrowser(true)}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors border border-slate-700"
                        >
                            Browse Questions
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {exam.questions.map((question, index) => (
                                <motion.div
                                    key={question.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 group hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-sm font-bold text-slate-400">
                                            Q{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <SafeHtml
                                                className="prose prose-invert max-w-none text-slate-300 mb-4"
                                                html={question.content}
                                            />

                                            <div className="flex flex-wrap gap-2">
                                                {question.topic && (
                                                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-400 border border-slate-700">
                                                        Topic: {question.topic}
                                                    </span>
                                                )}
                                                {question.difficultyWeight && (
                                                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-400 border border-slate-700">
                                                        Difficulty: {question.difficultyWeight}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                onClick={() => handleRemoveQuestion(question.id)}
                                                disabled={removingQuestionId === question.id}
                                                className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Remove from exam"
                                            >
                                                {removingQuestionId === question.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <X className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Question Browser Modal */}
            {showQuestionBrowser && (
                <QuestionBankBrowser
                    examId={exam.id}
                    onClose={() => setShowQuestionBrowser(false)}
                    onQuestionsLinked={() => {
                        fetchExamDetails();
                        setShowQuestionBrowser(false);
                    }}
                />
            )}

            {/* Upload Questions Modal */}
            <UploadExamQuestionsModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    fetchExamDetails();
                    setShowUploadModal(false);
                }}
                examId={exam.id}
                examTitle={exam.title}
            />

            {/* Edit Exam Modal */}
            <EditExamModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                exam={exam}
                onSuccess={() => {
                    fetchExamDetails();
                    setShowEditModal(false);
                }}
            />
        </div>
    );
}

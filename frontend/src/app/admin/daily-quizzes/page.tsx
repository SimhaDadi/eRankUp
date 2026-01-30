'use client';
import 'reflect-metadata';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Zap,
    ExternalLink,
    HelpCircle,
    Calendar,
    FileText
} from 'lucide-react';
import api from '@/lib/api';
import { CreateExamModal } from '@/components/admin/CreateExamModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Exam {
    id: string;
    title: string;
    description: string;
    isActive: boolean;
    isPublished: boolean;
    createdAt: string;
    category?: string;
    questionCount?: number;
    duration?: number;
}

export default function AdminDailyQuizzesPage() {
    const [quizzes, setQuizzes] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const fetchQuizzes = async () => {
        try {
            // Fetch raw exams. In a larger app, we'd want a backend filter parameter for category
            const response = await api.get('/exams');
            const allExams = Array.isArray(response.data) ? response.data : [];
            // Filter strictly for Free Quiz AND Published
            setQuizzes(allExams.filter((e: Exam) => e.category === 'Free Quiz' && e.isPublished));
        } catch (error) {
            console.error("Failed to fetch quizzes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this quiz?')) {
            try {
                await api.delete(`/exams/${id}`);
                setQuizzes(quizzes.filter(e => e.id !== id));
            } catch (error) {
                alert('Failed to delete quiz');
            }
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/exams/${id}/publish`, { isPublished: !currentStatus });
            setQuizzes(quizzes.map(e => e.id === id ? { ...e, isPublished: !currentStatus } : e));
        } catch (error) {
            alert('Failed to update publish status');
        }
    };

    const handleExportCSV = async (id: string, title: string) => {
        try {
            const response = await api.get(`/exams/${id}/export/csv`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `quiz-${title.replace(/\s+/g, '-').toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export CSV", error);
            alert('Failed to export CSV');
        }
    };

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
                        Daily Quizzes
                    </h1>
                    <p className="text-slate-400">Manage short, free quizzes for daily student engagement.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                >
                    <Plus className="w-5 h-5" /> New Daily Quiz
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800 w-full md:w-96">
                <Search className="w-4 h-4 text-slate-500 ml-2" />
                <input
                    type="text"
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full text-slate-300 placeholder:text-slate-600"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredQuizzes.map((quiz) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={quiz.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all group relative overflow-hidden"
                        >
                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-900/80 backdrop-blur rounded-lg p-1">
                                <button
                                    onClick={() => handleExportCSV(quiz.id, quiz.title)}
                                    className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                    title="Export Question Paper (CSV)"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${quiz.isPublished
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-yellow-500/10 text-yellow-400'
                                        }`}
                                >
                                    {quiz.isPublished ? 'Published' : 'Draft'}
                                </button>
                                <Link href={`/admin/exams/${quiz.id}`} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <Edit className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(quiz.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-6 h-6 text-amber-500" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold truncate pr-8">{quiz.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(quiz.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <HelpCircle className="w-3 h-3" />
                                            {quiz.questionCount || 0} Qs
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                <div className="text-xs font-bold text-slate-500">
                                    {quiz.duration || 15} Min
                                </div>
                                <Link
                                    href={`/admin/exams/${quiz.id}`}
                                    className="text-amber-400 hover:text-amber-300 text-sm font-bold flex items-center gap-1"
                                >
                                    Manage Content <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredQuizzes.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300">No Daily Quizzes Found</h3>
                        <p className="text-slate-500 mt-2">Create your first daily quiz to engage students.</p>
                    </div>
                )}
            </div>

            <CreateExamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(examId) => router.push(`/admin/exams/${examId}`)}
                defaultCategory="Free Quiz"
            />
        </div>
    );
}

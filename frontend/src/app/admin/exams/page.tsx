'use client';
import 'reflect-metadata';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    BookOpen,
    Layers,
    HelpCircle
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { Database } from 'lucide-react'; // Import Database icon for Bank
import { CreateExamModal } from '@/components/admin/CreateExamModal';
import { useRouter, useSearchParams } from 'next/navigation';

interface Exam {
    id: string;
    title: string;
    description: string;
    isActive: boolean;
    isPublished: boolean;
    createdAt: string;
    chapters: any[];
    type: 'real_exam' | 'question_bank';
    questionCount?: number;
}

export default function AdminExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const fetchExams = async () => {
        try {
            const response = await api.get('/exams');
            setExams(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch exams", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    // ... (rest of methods: handleDelete, handleTogglePublish)

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this exam? All associated chapters and questions will be lost.')) {
            try {
                await api.delete(`/exams/${id}`);
                setExams(exams.filter(e => e.id !== id));
            } catch (error) {
                alert('Failed to delete exam');
            }
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/exams/${id}/publish`, { isPublished: !currentStatus });
            setExams(exams.map(e => e.id === id ? { ...e, isPublished: !currentStatus } : e));
        } catch (error) {
            alert('Failed to update publish status');
        }
    };

    const [filterType, setFilterType] = useState<'all' | 'real_exam' | 'question_bank'>('real_exam');

    const filteredExams = exams.filter(exam => {
        const matchesType = filterType === 'all' || exam.type === filterType;
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Manage Exams</h1>
                    <p className="text-slate-400">Create, edit, and organize your platform content hierarchy.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-5 h-5" /> Create New Exam
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-1">
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${filterType === 'all' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    All Content
                </button>
                <button
                    onClick={() => setFilterType('real_exam')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${filterType === 'real_exam' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    Real Exams
                </button>
                <button
                    onClick={() => setFilterType('question_bank')}
                    className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${filterType === 'question_bank' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    Question Banks
                </button>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Total Exams</span>
                    </div>
                    <div className="text-3xl font-bold">{exams.length}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                        <Layers className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Chapters</span>
                    </div>
                    <div className="text-3xl font-bold">
                        {exams.reduce((acc, curr) => acc + (curr.chapters?.length || 0), 0)}
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 text-purple-400 mb-2">
                        <HelpCircle className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Total Questions</span>
                    </div>
                    <div className="text-3xl font-bold">
                        {exams.reduce((acc, exam) => acc + (exam.questionCount || 0), 0)}
                    </div>
                </div>
            </div>



            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredExams.map((exam) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={exam.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${exam.type === 'question_bank' ? 'bg-purple-600/10' : 'bg-blue-600/10'}`}>
                                    {exam.type === 'question_bank' ? (
                                        <Database className="w-6 h-6 text-purple-500" />
                                    ) : (
                                        <BookOpen className="w-6 h-6 text-blue-500" />
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${exam.isPublished
                                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20'
                                            : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400 shadow-yellow-500/20'
                                            }`}
                                    >
                                        {exam.isPublished ? 'Published' : 'Draft'}
                                    </button>
                                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exam.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                {exam.title}
                                {exam.type === 'question_bank' && (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        BANK
                                    </span>
                                )}
                            </h3>
                            <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                                {exam.description || 'No description provided for this examination.'}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> {exam.chapters?.length || 0} Chapters
                                </div>
                                <div className="flex gap-4">
                                    <Link
                                        href={`/dashboard/exams`}
                                        className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1"
                                    >
                                        Student View <ExternalLink className="w-3 h-3" />
                                    </Link>
                                    <Link
                                        href={`/admin/exams/${exam.id}`}
                                        className="text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-1 underline underline-offset-4"
                                    >
                                        Manage Content
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredExams.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
                        <div className="text-slate-500 mb-2">No exams found matching your filter.</div>
                    </div>
                )}
            </div>
            {/* Create Exam Modal */}
            <CreateExamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={(examId) => {
                    router.push(`/admin/exams/${examId}`);
                }}
            />
        </div>
    );
}

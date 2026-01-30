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
    HelpCircle,
    Zap,
    FileText
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
    type: 'real_exam' | 'question_bank' | 'live_exam' | 'previous_year_paper';
    category?: string;
    questionCount?: number;
}

export default function AdminMockTestsPage() {
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

    const handleExportCSV = async (id: string, title: string) => {
        try {
            const response = await api.get(`/exams/${id}/export/csv`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `questions-${title.replace(/\s+/g, '-').toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export CSV", error);
            alert('Failed to export CSV');
        }
    };

    // Filter: Published AND Real Exam AND Not Free Quiz (just in case)
    const filteredExams = exams.filter(exam => {
        const isMockTest = exam.type === 'real_exam' && exam.category !== 'Free Quiz';
        const isPublished = exam.isPublished === true;
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
        return isMockTest && isPublished && matchesSearch;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Mock Tests</h1>
                    <p className="text-slate-400">Manage your published full-length mock tests.</p>
                </div>
                <div className="flex gap-3">
                    {/* Create button usually goes to Drafts, but maybe allow creating here too? 
                       For "Move on Publish" workflow, creation starts in Drafts. 
                       But let's keep it user friendly. If they create here, it likely starts as draft, 
                       so it would disappear from this list!
                       Better to redirect them to Drafts or just hide the create button?
                       User said "Manage Exams" is inbox.
                       Let's add a button to go to "Drafts" instead of create?
                       Or keep create, but warn?
                       Let's keep create but maybe label it "Create New DO Not Publish Yet".
                       Actually, if they create, it's draft.
                       So let's link "Create New" to opening the modal, but knowing it won't show up here until published.
                       That might be confusing. 
                       Let's put a link to "Drafts" to create.
                   */}
                    <Link href="/admin/exams">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            <Plus className="w-4 h-4" />
                            Create New (Go to Drafts)
                        </button>
                    </Link>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search mock tests..."
                        value={searchQuery}
                        onChange={(e) => router.push(`?search=${e.target.value}`)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                </div>
            ) : filteredExams.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No Published Mock Tests Found</h3>
                    <p className="text-slate-500 mt-2">Publish a 'Real Exam' from the Drafts & Staging page to see it here.</p>
                    <Link href="/admin/exams" className="text-blue-500 hover:underline mt-4 inline-block">
                        Go to Drafts
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredExams.map((exam) => (
                            <motion.div
                                key={exam.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
                            >
                                <div className="absolute top-4 right-4 z-10">
                                    <div className="relative">
                                        <button className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100">
                                            {/* Actions? Maybe just unpublish */}
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleExportCSV(exam.id, exam.title)}
                                                className="p-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                title="Export Question Paper (CSV)"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleTogglePublish(exam.id, exam.isPublished)}
                                                className="p-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                                title="Unpublish (Move to Drafts)"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                            <Link href={`/admin/exams/${exam.id}/edit`}>
                                                <button className="p-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="p-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-100 line-clamp-1 mb-1 group-hover:text-blue-400 transition-colors">
                                        {exam.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">
                                        {exam.description || 'No description provided'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                                        <div className="text-xs text-slate-500 mb-1">Chapters</div>
                                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                            {exam.chapters?.length || 0}
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                                        <div className="text-xs text-slate-500 mb-1">Questions</div>
                                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                                            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                                            {exam.questionCount || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                    <span className="text-xs font-mono text-slate-500">
                                        {new Date(exam.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                                        PUBLISHED
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

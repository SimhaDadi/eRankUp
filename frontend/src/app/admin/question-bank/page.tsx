'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Filter,
    Download,
    Upload,
    Edit,
    Trash2,
    ExternalLink,
    CheckCircle2,
    Clock,
    Tag,
    Layers,
    Grid,
    X
} from 'lucide-react';
import api from '@/lib/api';
import CreateQuestionModal from '@/components/admin/CreateQuestionModal';
import BulkImportModal from '@/components/admin/BulkImportModal';

interface Question {
    id: string;
    content: string;
    subject?: { title: string };
    chapter?: { id: string; title: string };
    difficultyWeight: number;
    positiveMarks: number;
    negativeMarks: number;
    examId?: string | null;
    exam?: { id: string; title: string };
}

export default function QuestionBank() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [examFilter, setExamFilter] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch exams for filter dropdown
                const examsResponse = await api.get('/exams');
                setExams(examsResponse.data);

                // Fetch questions based on filter
                let questionsResponse;
                if (examFilter === 'all') {
                    // Fetch all questions from nested hierarchy
                    const allQs: Question[] = [];
                    examsResponse.data.forEach((exam: any) => {
                        exam.models?.forEach((model: any) => {
                            model.questions?.forEach((q: any) => {
                                allQs.push({
                                    ...q,
                                    subject: model.chapter?.subject,
                                    chapter: model.chapter
                                });
                            });
                        });
                    });
                    setQuestions(allQs);
                } else if (examFilter === 'global') {
                    // Fetch only global questions
                    questionsResponse = await api.get('/exams/questions/global');
                    setQuestions(questionsResponse.data);
                } else {
                    // Fetch exam-specific questions
                    questionsResponse = await api.get(`/exams/questions/exam/${examFilter}`);
                    setQuestions(questionsResponse.data);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [examFilter]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

    // ... (rest of search/filter state)

    return (
        <div className="space-y-8 pb-10">
            {/* ... Header ... */}
            <header className="flex justify-between items-end">
                {/* ... */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsBulkImportModalOpen(true)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-slate-700/50 transition-all"
                    >
                        <Upload className="w-4 h-4" /> Bulk Import
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all border border-cyan-400/20"
                    >
                        <Plus className="w-4 h-4" /> Create Question
                    </motion.button>
                </div>
            </header>

            <CreateQuestionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    // Re-fetch questions or reload page
                    window.location.reload();
                }}
            />

            <BulkImportModal
                isOpen={isBulkImportModalOpen}
                onClose={() => setIsBulkImportModalOpen(false)}
                onSuccess={() => {
                    window.location.reload();
                }}
            />

            {/* ... Filters Bar & Table ... */}
            <div className="flex flex-wrap gap-4 items-center justify-between p-6 bg-slate-900/40 border border-slate-800/50 rounded-[2rem] backdrop-blur-xl">
// ...
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <div className="flex-1 flex items-center gap-3 bg-slate-950/50 px-5 py-3 rounded-2xl border border-slate-800 group focus-within:border-cyan-500/50 transition-all">
                        <Search className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-500" />
                        <input
                            type="text"
                            placeholder="Search by keywords or ID..."
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-300 placeholder:text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700/50 text-slate-400 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exam Scope:</span>
                        <select
                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-300 outline-none focus:border-cyan-500/50"
                            value={examFilter}
                            onChange={(e) => setExamFilter(e.target.value)}
                        >
                            <option value="all">All Questions</option>
                            <option value="global">Global Bank Only</option>
                            <option disabled className="text-slate-600">─────────────</option>
                            {exams.map((exam) => (
                                <option key={exam.id} value={exam.id}>{exam.title} Specific</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-800 mx-2"></div>
                    <button className="p-2 text-slate-400 hover:text-white transition-all">
                        <Grid className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Questions Table */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800/50 bg-slate-950/20">
                            <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Question Details</th>
                            <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Taxonomy</th>
                            <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Difficulty</th>
                            <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Marking</th>
                            <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-8 py-8"><div className="h-4 bg-slate-800 rounded w-full opacity-20"></div></td>
                                </tr>
                            ))
                        ) : (
                            questions.map((q) => (
                                <tr key={q.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                                    <td className="px-8 py-6 max-w-md">
                                        <div className="text-slate-200 font-medium leading-relaxed line-clamp-2">
                                            {q.content}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-tighter">ID: {q.id.substring(0, 8)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            {q.examId ? (
                                                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-md text-[10px] font-black text-purple-400 uppercase tracking-wide">
                                                    {q.exam?.title || 'Exam-Specific'}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded-md text-[10px] font-black text-teal-400 uppercase tracking-wide">
                                                    Global
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-3 h-3 text-purple-500" />
                                                <span className="text-xs font-bold text-slate-300">{q.subject?.title || 'General'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-3 h-3 text-amber-500" />
                                                <span className="text-xs font-medium text-slate-500">{q.chapter?.title || 'Uncategorized'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700/50">
                                            <div className={`w-1.5 h-1.5 rounded-full ${q.difficultyWeight > 0.7 ? 'bg-rose-500' : q.difficultyWeight > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wide">
                                                {q.difficultyWeight > 0.7 ? 'Hard' : q.difficultyWeight > 0.4 ? 'Medium' : 'Easy'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-emerald-500">+{q.positiveMarks}</span>
                                            <span className="text-xs font-black text-rose-500">-{q.negativeMarks}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700/50 transition-all text-slate-400 hover:text-white">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all text-rose-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Plus,
    BookOpen,
    Layers,
    Target,
    HelpCircle,
    Upload,
    Trash2,
    Edit,
    ChevronDown,
    ChevronUp,
    Grid,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import api from '@/lib/api';
import BulkImport from '@/components/admin/BulkImport';
import CreateModelModal from '@/components/admin/CreateModelModal';
import CreateQuestionModal from '@/components/admin/CreateQuestionModal';

interface Question {
    id: string;
    content: string;
}

interface Chapter {
    id: string;
    title: string;
    subject?: { title: string };
}

interface Model {
    id: string;
    title: string;
    chapter: Chapter;
    questions?: Question[];
    totalQuestions: number;
}

interface Exam {
    id: string;
    title: string;
    description: string;
    models: Model[];
    defaultPositiveMarks: number;
    defaultNegativeMarks: number;
}

export default function ExamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [exam, setExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isCreateModelOpen, setIsCreateModelOpen] = useState(false);
    const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

    const fetchExamDetails = async () => {
        try {
            const response = await api.get(`/exams/${params.id}`);
            setExam(response.data);
        } catch (error) {
            console.error("Failed to fetch exam details", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExamDetails();
    }, [params.id]);

    const handleBulkImport = (modelId: string) => {
        setSelectedModelId(modelId);
        setIsBulkImportOpen(true);
    };

    // Group models by Subject/Chapter
    const groupedModels = exam?.models.reduce((acc, model) => {
        const key = model.chapter?.id || 'unassigned';
        if (!acc[key]) acc[key] = { chapter: model.chapter, models: [] };
        acc[key].models.push(model);
        return acc;
    }, {} as Record<string, { chapter: Chapter, models: Model[] }>);

    if (isLoading) return <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Synchronizing Exam Data...</div>;
    if (!exam) return <div className="p-12 text-center text-rose-400 font-black">404: Exam Node Not Found.</div>;

    return (
        <div className="space-y-8 pb-10">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all font-bold group"
            >
                <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg group-hover:border-cyan-500/50">
                    <ChevronLeft className="w-4 h-4" />
                </div>
                Back to Exams
            </button>

            {/* Header Card */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-10 rounded-[2.5rem] shadow-2xl shadow-black/20 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 opacity-50"></div>
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl border border-cyan-500/20 shadow-inner shadow-cyan-500/5">
                            <BookOpen className="w-8 h-8 text-cyan-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">{exam.title}</h1>
                            <div className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mt-1">Exam Configuration Payload</div>
                        </div>
                    </div>
                    <p className="text-slate-400 max-w-2xl font-medium leading-relaxed">{exam.description || 'No description provided for this exam bundle.'}</p>
                    <div className="flex gap-4 mt-8">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-emerald-500/5">
                            <CheckCircle2 className="w-3 h-3" /> Correct: +{exam.defaultPositiveMarks || 1}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-rose-500/5">
                            <AlertTriangle className="w-3 h-3" /> Incorrect: -{exam.defaultNegativeMarks || 0.25}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button className="p-4 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 rounded-2xl transition-all group backdrop-blur-md">
                        <Edit className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                    <button className="p-4 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all border border-rose-500/20 group backdrop-blur-md">
                        <Trash2 className="w-5 h-5 text-rose-500" />
                    </button>
                </div>
            </div>

            {/* Test Models Grouped by Hierarchy */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Layers className="w-6 h-6 text-purple-400" />
                        </div>
                        Mock Tests & Content
                    </h2>
                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700/50">
                            <Grid className="w-4 h-4" /> Link Existing Model
                        </button>
                        <button
                            onClick={() => setIsCreateModelOpen(true)}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20 border border-cyan-500/20">
                            <Plus className="w-4 h-4" /> Create New Test
                        </button>
                    </div>
                </div>

                <div className="grid gap-6">
                    {groupedModels && Object.values(groupedModels).map((group) => (
                        <div key={group.chapter?.id || 'none'} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[2rem] overflow-hidden group">
                            <div
                                onClick={() => setExpandedGroup(expandedGroup === group.chapter?.id ? null : group.chapter?.id)}
                                className={`p-8 flex justify-between items-center cursor-pointer transition-all ${expandedGroup === group.chapter?.id ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`p-3 rounded-2xl transition-all duration-300 ${expandedGroup === group.chapter?.id ? 'bg-purple-500/20 shadow-lg shadow-purple-500/10' : 'bg-slate-800 group-hover:bg-purple-500/10'}`}>
                                        <Layers className={`w-6 h-6 ${expandedGroup === group.chapter?.id ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400'}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black text-slate-100">{group.chapter?.title || 'General / Uncategorized'}</span>
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-700/50">
                                                {group.chapter?.subject?.title || 'All Subjects'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">
                                            {group.models.length} Model Sets Linked
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-xl transition-colors ${expandedGroup === group.chapter?.id ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                    {expandedGroup === group.chapter?.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedGroup === group.chapter?.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'circOut' }}
                                        className="border-t border-slate-800/50 bg-[#0c111d]/50"
                                    >
                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {group.models.map((model) => (
                                                <div key={model.id} className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-3xl flex justify-between items-center hover:border-cyan-500/30 transition-all hover:bg-cyan-500/[0.02] group/model shadow-sm">
                                                    <div className="flex items-center gap-5">
                                                        <div className="bg-cyan-500/10 p-3 rounded-2xl border border-cyan-500/20 group-hover/model:scale-110 transition-transform">
                                                            <Target className="w-5 h-5 text-cyan-400" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-100 group-hover/model:text-white transition-colors">{model.title}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{model.totalQuestions || 0} Qs</div>
                                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                                <div className="text-[10px] font-black uppercase text-cyan-500/60 tracking-widest transition-colors group-hover/model:text-cyan-400">Mock Test Payload</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover/model:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleBulkImport(model.id); }}
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            <Upload className="w-3.5 h-3.5" /> Import
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedModelId(model.id); setIsCreateQuestionOpen(true); }}
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/20 text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                            <Plus className="w-3.5 h-3.5" /> Add Q
                                                        </button>
                                                        <button className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl transition-colors">
                                                            <Edit className="w-4 h-4 text-slate-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {isBulkImportOpen && selectedModelId && (
                <BulkImport
                    modelId={selectedModelId}
                    onClose={() => setIsBulkImportOpen(false)}
                    onSuccess={() => {
                        setIsBulkImportOpen(false);
                        fetchExamDetails();
                    }}
                />
            )}

            {exam && (
                <CreateModelModal
                    isOpen={isCreateModelOpen}
                    onClose={() => setIsCreateModelOpen(false)}
                    examId={exam.id}
                    onSuccess={() => {
                        fetchExamDetails();
                    }}
                />
            )}

            {isCreateQuestionOpen && exam && (
                <CreateQuestionModal
                    isOpen={isCreateQuestionOpen}
                    onClose={() => setIsCreateQuestionOpen(false)}
                    preSelectedExamId={exam.id}
                    preSelectedModelId={selectedModelId || undefined}
                    onSuccess={() => {
                        fetchExamDetails();
                    }}
                />
            )}
        </div>
    );
}

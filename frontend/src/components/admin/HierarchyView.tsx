'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronRight,
    BookOpen,
    Folder,
    FileText,
    Plus,
    Edit,
    Trash2,
    Library
} from 'lucide-react';

interface Model {
    id: string;
    title: string;
    totalQuestions?: number;
}

interface Chapter {
    id: string;
    title: string;
    description?: string;
    models?: Model[];
}

interface Subject {
    id: string;
    title: string;
    description?: string;
    chapters?: Chapter[];
}

interface HierarchyViewProps {
    subjects: Subject[];
    onCreateSubject: () => void;
    onCreateChapter: (subjectId: string) => void;
    onCreateModel: (chapterId: string) => void;
    onManageQuestions: (modelId: string) => void;
    onEditSubject?: (subject: Subject) => void;
    onEditChapter?: (chapter: Chapter) => void;
    onEditModel?: (model: Model) => void;
    onDeleteSubject?: (subjectId: string) => void;
    onDeleteChapter?: (chapterId: string) => void;
    onDeleteModel?: (modelId: string) => void;
}

export function HierarchyView({
    subjects,
    onCreateSubject,
    onCreateChapter,
    onCreateModel,
    onManageQuestions,
    onEditSubject,
    onEditChapter,
    onEditModel,
    onDeleteSubject,
    onDeleteChapter,
    onDeleteModel
}: HierarchyViewProps) {
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

    const toggleSubject = (subjectId: string) => {
        const newSet = new Set(expandedSubjects);
        if (newSet.has(subjectId)) {
            newSet.delete(subjectId);
        } else {
            newSet.add(subjectId);
        }
        setExpandedSubjects(newSet);
    };

    const toggleChapter = (chapterId: string) => {
        const newSet = new Set(expandedChapters);
        if (newSet.has(chapterId)) {
            newSet.delete(chapterId);
        } else {
            newSet.add(chapterId);
        }
        setExpandedChapters(newSet);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Library className="w-6 h-6 text-blue-500" />
                    Subjects & Chapters
                </h2>
                <button
                    onClick={onCreateSubject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Create Subject
                </button>
            </div>

            {/* Subjects List */}
            {subjects.length === 0 ? (
                <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No subjects yet</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Create your first subject to start organizing chapter-wise tests.
                    </p>
                    <button
                        onClick={onCreateSubject}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors border border-slate-700"
                    >
                        Create Subject
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {subjects.map((subject) => (
                        <motion.div
                            key={subject.id}
                            layout
                            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                        >
                            {/* Subject Header */}
                            <div className="flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleSubject(subject.id)}
                                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        {expandedSubjects.has(subject.id) ? (
                                            <ChevronDown className="w-5 h-5 text-blue-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">{subject.title}</h3>
                                        {subject.description && (
                                            <p className="text-sm text-slate-400 mt-1">{subject.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {subject.chapters?.length || 0} Chapters
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {onEditSubject && (
                                        <button
                                            onClick={() => onEditSubject(subject)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            title="Edit Subject"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {onDeleteSubject && (
                                        <button
                                            onClick={() => onDeleteSubject(subject.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                            title="Delete Subject"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chapters */}
                            <AnimatePresence>
                                {expandedSubjects.has(subject.id) && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="border-t border-slate-800 bg-slate-900/50"
                                    >
                                        <div className="p-6 space-y-3">
                                            {/* Create Chapter Button */}
                                            <button
                                                onClick={() => onCreateChapter(subject.id)}
                                                className="w-full px-4 py-3 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl text-slate-400 hover:text-blue-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Chapter
                                            </button>

                                            {/* Chapters List */}
                                            {subject.chapters?.map((chapter) => (
                                                <div
                                                    key={chapter.id}
                                                    className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                                                >
                                                    {/* Chapter Header */}
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <button
                                                                onClick={() => toggleChapter(chapter.id)}
                                                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                            >
                                                                {expandedChapters.has(chapter.id) ? (
                                                                    <ChevronDown className="w-4 h-4 text-purple-400" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                                )}
                                                            </button>
                                                            <div className="w-8 h-8 bg-purple-600/10 rounded-lg flex items-center justify-center">
                                                                <Folder className="w-4 h-4 text-purple-500" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-white text-sm">{chapter.title}</h4>
                                                                <span className="text-xs text-slate-500">
                                                                    {chapter.models?.length || 0} Tests
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {onEditChapter && (
                                                                <button
                                                                    onClick={() => onEditChapter(chapter)}
                                                                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                                                    title="Edit Chapter"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            {onDeleteChapter && (
                                                                <button
                                                                    onClick={() => onDeleteChapter(chapter.id)}
                                                                    className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500 transition-colors"
                                                                    title="Delete Chapter"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Models */}
                                                    <AnimatePresence>
                                                        {expandedChapters.has(chapter.id) && (
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: 'auto' }}
                                                                exit={{ height: 0 }}
                                                                className="border-t border-slate-700"
                                                            >
                                                                <div className="p-4 space-y-2">
                                                                    {/* Create Model Button */}
                                                                    <button
                                                                        onClick={() => onCreateModel(chapter.id)}
                                                                        className="w-full px-3 py-2 border border-dashed border-slate-600 hover:border-cyan-500 rounded-lg text-slate-400 hover:text-cyan-400 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                        Add Test
                                                                    </button>

                                                                    {/* Models List */}
                                                                    {chapter.models?.map((model) => (
                                                                        <div
                                                                            key={model.id}
                                                                            className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-600 rounded-lg hover:border-cyan-500/50 transition-all group"
                                                                        >
                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                                                                                <span className="text-sm font-medium text-white">{model.title}</span>
                                                                                <span className="text-xs text-slate-500">
                                                                                    ({model.totalQuestions || 0} Qs)
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => onManageQuestions(model.id)}
                                                                                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
                                                                                >
                                                                                    Manage
                                                                                </button>
                                                                                {onEditModel && (
                                                                                    <button
                                                                                        onClick={() => onEditModel(model)}
                                                                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                                                        title="Edit Test"
                                                                                    >
                                                                                        <Edit className="w-3 h-3" />
                                                                                    </button>
                                                                                )}
                                                                                {onDeleteModel && (
                                                                                    <button
                                                                                        onClick={() => onDeleteModel(model.id)}
                                                                                        className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                                        title="Delete Test"
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    {(!chapter.models || chapter.models.length === 0) && (
                                                                        <div className="text-center py-4 text-slate-500 text-xs">
                                                                            No tests yet. Click "Add Test" to create one.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}

                                            {(!subject.chapters || subject.chapters.length === 0) && (
                                                <div className="text-center py-8 text-slate-500 text-sm">
                                                    No chapters yet. Click "Add Chapter" to create one.
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

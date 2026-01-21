'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    ChevronRight,
    Folder,
    Book,
    MoreVertical,
    Edit,
    Trash2,
    Grid,
    Binary,
    Globe,
    Cpu,
    BookOpen,
    Layers
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import CreateSubjectModal from '@/components/admin/CreateSubjectModal';
import CreateChapterModal from '@/components/admin/CreateChapterModal';
import EditSubjectModal from '@/components/admin/EditSubjectModal';
import EditChapterModal from '@/components/admin/EditChapterModal';

interface Chapter {
    id: string;
    title: string;
    description: string;
}

interface Subject {
    id: string;
    title: string;
    description: string;
    icon: string;
    chapters: Chapter[];
}

export default function HierarchyManager() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await api.get('/exams/subjects/all');
                setSubjects(response.data);
                if (response.data.length > 0) setActiveSubject(response.data[0].id);
            } catch (error) {
                console.error("Failed to fetch subjects", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubjects();
    }, []);

    const selectedSubject = subjects.find(s => s.id === activeSubject);

    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);

    // Edit States
    const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
    const [isEditChapterModalOpen, setIsEditChapterModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<any>(null);

    const handleDeleteSubject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this subject? All chapters and questions within it will be hidden.")) return;

        try {
            await api.delete(`/exams/subjects/${id}`);
            window.location.reload();
        } catch (err) {
            alert("Failed to delete subject");
        }
    };

    const handleDeleteChapter = async (subjectId: string, chapterId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this chapter?")) return;

        try {
            await api.delete(`/exams/subjects/${subjectId}/chapters/${chapterId}`);
            window.location.reload();
        } catch (err) {
            alert("Failed to delete chapter");
        }
    };

    if (isLoading) return (
        // ...
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Content Hierarchy
                    </h1>
                    <p className="text-slate-400 font-medium">Manage Subjects, Chapters and Model Test structure.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setIsSubjectModalOpen(true)}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all border border-cyan-400/20"
                >
                    <Plus className="w-4 h-4" /> New Subject
                </motion.button>
            </header>

            <CreateSubjectModal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} onSuccess={() => window.location.reload()} />

            {selectedSubject && (
                <EditSubjectModal
                    isOpen={isEditSubjectModalOpen}
                    onClose={() => setIsEditSubjectModalOpen(false)}
                    onSuccess={() => window.location.reload()}
                    subject={selectedSubject}
                />
            )}

            {activeSubject && (
                <>
                    <CreateChapterModal
                        isOpen={isChapterModalOpen}
                        onClose={() => setIsChapterModalOpen(false)}
                        onSuccess={() => window.location.reload()}
                        subjectId={activeSubject}
                    />
                    <EditChapterModal
                        isOpen={isEditChapterModalOpen}
                        onClose={() => setIsEditChapterModalOpen(false)}
                        onSuccess={() => window.location.reload()}
                        subjectId={activeSubject}
                        chapter={editingChapter}
                    />
                </>
            )}

            <div className="grid grid-cols-12 gap-8">
                {/* Subjects List */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Subjects</h2>
                    <div className="space-y-2">
                        {subjects.map((subject) => (
                            <motion.button
                                key={subject.id}
                                onClick={() => setActiveSubject(subject.id)}
                                whileHover={{ x: 4 }}
                                className={`w-full flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group relative ${activeSubject === subject.id
                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-500/5'
                                    : 'bg-slate-900/40 border-slate-800/50 text-slate-400 hover:bg-slate-800/50 hover:border-slate-700'
                                    }`}
                            >
                                <div className={`p-3 rounded-2xl transition-colors ${activeSubject === subject.id ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                                    <Grid className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className={`font-black tracking-tight ${activeSubject === subject.id ? 'text-white' : 'group-hover:text-slate-200'}`}>
                                        {subject.title}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest mt-0.5">
                                        {subject.chapters?.length || 0} Chapters
                                    </div>
                                </div>

                                {activeSubject !== subject.id && (
                                    <button
                                        onClick={(e) => handleDeleteSubject(subject.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:text-rose-500 transition-all"
                                        title="Delete Subject"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                <ChevronRight className={`w-4 h-4 transition-transform ${activeSubject === subject.id ? 'rotate-90 text-cyan-500' : 'opacity-20'}`} />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Chapters List */}
                <div className="col-span-12 lg:col-span-8">
                    {activeSubject ? (
                        <div className="space-y-6">
                            {/* ... Header Card ... */}
                            <div className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Grid className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{selectedSubject?.title}</h3>
                                        <p className="text-slate-400 mt-2 max-w-lg font-medium">{selectedSubject?.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditSubjectModalOpen(true)}
                                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700/50 transition-all text-slate-400 hover:text-white"
                                            title="Edit Subject"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => selectedSubject && handleDeleteSubject(selectedSubject.id, e)}
                                            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all text-rose-500"
                                            title="Delete Subject"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Chapters</h4>
                                <button
                                    onClick={() => setIsChapterModalOpen(true)}
                                    className="text-xs font-black text-cyan-500 hover:text-cyan-400 uppercase tracking-wide flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Chapter
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedSubject?.chapters?.map((chapter) => (
                                    <motion.div
                                        key={chapter.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-slate-900/40 border border-slate-800/50 rounded-3xl hover:border-slate-700 transition-all group relative"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-slate-800 rounded-2xl group-hover:bg-cyan-500/10 transition-colors group-hover:text-cyan-500">
                                                <Folder className="w-5 h-5" />
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingChapter(chapter);
                                                        setIsEditChapterModalOpen(true);
                                                    }}
                                                    className="p-1 hover:text-white"
                                                    title="Edit Chapter"
                                                >
                                                    <Edit className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                                                </button>
                                                <button
                                                    onClick={(e) => activeSubject && handleDeleteChapter(activeSubject, chapter.id, e)}
                                                    className="p-1 hover:text-rose-500"
                                                    title="Delete Chapter"
                                                >
                                                    <Trash2 className="w-4 h-4 text-slate-500" />
                                                </button>
                                            </div>
                                        </div>
                                        <h5 className="font-bold text-lg text-slate-100 group-hover:text-white transition-colors">{chapter.title}</h5>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{chapter.description}</p>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                    12 Models
                                                </div>
                                                <div className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                    452 Qs
                                                </div>
                                            </div>
                                            <Link
                                                href={`/admin/question-bank?chapterId=${chapter.id}`}
                                                className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:underline"
                                            >
                                                Manage
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[2.5rem]">
                            <Layers className="w-16 h-16 text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">Select a subject to manage its chapters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

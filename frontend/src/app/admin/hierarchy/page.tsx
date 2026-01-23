'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, BookOpen, FolderOpen, FileText, Search, Upload } from 'lucide-react';
import UploadModelModal from '@/components/admin/UploadModelModal';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface Exam {
    id: string;
    title: string;
    description?: string;
    subjects?: Subject[];
}

interface Subject {
    id: string;
    title: string;
    examId: string;
    chapters?: Chapter[];
}

interface Model {
    id: string;
    title: string;
    totalQuestions: number;
    chapterId: string;
}

interface Chapter {
    id: string;
    title: string;
    subjectId: string;
    questionCount?: number;
    models?: Model[];
}

export default function HierarchyPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [showExamModal, setShowExamModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [editMode, setEditMode] = useState(false);

    const [examForm, setExamForm] = useState({ title: '', description: '' });
    const [subjectForm, setSubjectForm] = useState({ title: '', examId: '' });
    const [chapterForm, setChapterForm] = useState({ title: '', subjectId: '' });
    const [modelForm, setModelForm] = useState({ title: '', chapterId: '' });

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadModelData, setUploadModelData] = useState<{ id: string, title: string } | null>(null);

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            const response = await api.get('/exams/hierarchy?type=question_bank');
            // Transform backend response (name) to frontend format (title)
            const transformedData = response.data.map((exam: any) => ({
                ...exam,
                title: exam.name || exam.title,
                subjects: exam.subjects?.map((subject: any) => ({
                    ...subject,
                    title: subject.name || subject.title,
                    chapters: subject.chapters?.map((chapter: any) => ({
                        ...chapter,
                        title: chapter.name || chapter.title,
                        models: chapter.models?.map((model: any) => ({
                            ...model,
                            title: model.name || model.title
                        }))
                    }))
                }))
            }));
            setExams(transformedData);
        } catch (error) {
            console.error('Error fetching hierarchy:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExam = (examId: string) => {
        const newExpanded = new Set(expandedExams);
        if (newExpanded.has(examId)) {
            newExpanded.delete(examId);
        } else {
            newExpanded.add(examId);
        }
        setExpandedExams(newExpanded);
    };

    const toggleSubject = (subjectId: string) => {
        const newExpanded = new Set(expandedSubjects);
        if (newExpanded.has(subjectId)) {
            newExpanded.delete(subjectId);
        } else {
            newExpanded.add(subjectId);
        }
        setExpandedSubjects(newExpanded);
    };

    const toggleChapter = (chapterId: string) => {
        const newExpanded = new Set(expandedChapters);
        if (newExpanded.has(chapterId)) {
            newExpanded.delete(chapterId);
        } else {
            newExpanded.add(chapterId);
        }
        setExpandedChapters(newExpanded);
    };

    const handleCreateExam = async () => {
        try {
            await api.post('/exams', examForm);
            setShowExamModal(false);
            setExamForm({ title: '', description: '' });
            fetchHierarchy();
            alert('Exam created successfully!');
        } catch (error) {
            console.error('Error creating exam:', error);
            alert('Failed to create exam');
        }
    };

    const handleCreateSubject = async () => {
        try {
            await api.post('/subjects', { name: subjectForm.title, examId: subjectForm.examId });
            setShowSubjectModal(false);
            setSubjectForm({ title: '', examId: '' });
            fetchHierarchy();
            alert('Subject created successfully!');
        } catch (error) {
            console.error('Error creating subject:', error);
            alert('Failed to create subject');
        }
    };

    const handleCreateChapter = async () => {
        try {
            await api.post('/chapters', { name: chapterForm.title, subjectId: chapterForm.subjectId });
            setShowChapterModal(false);
            setChapterForm({ title: '', subjectId: '' });
            fetchHierarchy();
            alert('Chapter created successfully!');
        } catch (error) {
            console.error('Error creating chapter:', error);
            alert('Failed to create chapter');
        }
    };

    const handleCreateModel = async () => {
        try {
            await api.post(`/exams/chapters/${modelForm.chapterId}/models`, { title: modelForm.title });
            setShowModelModal(false);
            setModelForm({ title: '', chapterId: '' });
            fetchHierarchy();
            alert('Model created successfully!');
        } catch (error) {
            console.error('Error creating model:', error);
            alert('Failed to create model');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Content Hierarchy</h1>
                        <p className="text-gray-600">Manage exams, subjects, and chapters structure</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditMode(false);
                            setExamForm({ title: '', description: '' });
                            setShowExamModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Add Exam
                    </button>
                </div>

                {/* Hierarchy Tree */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">Loading hierarchy...</p>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No exams yet</h3>
                            <p className="text-gray-500 mb-4">Create your first exam to get started</p>
                            <button
                                onClick={() => setShowExamModal(true)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                Add First Exam
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {exams.map((exam) => (
                                <div key={exam.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Exam Level */}
                                    <div className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                onClick={() => toggleExam(exam.id)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                {expandedExams.has(exam.id) ? (
                                                    <ChevronDown className="w-5 h-5" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5" />
                                                )}
                                            </button>
                                            <BookOpen className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <h3 className="font-bold text-gray-900">{exam.title}</h3>
                                                {exam.description && (
                                                    <p className="text-sm text-gray-500">{exam.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSubjectForm({ title: '', examId: exam.id });
                                                    setShowSubjectModal(true);
                                                }}
                                                className="px-3 py-1 text-sm bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 rounded font-medium"
                                            >
                                                Add Subject
                                            </button>
                                            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subjects */}
                                    {expandedExams.has(exam.id) && exam.subjects && (
                                        <div className="pl-8 bg-gray-50">
                                            {exam.subjects.map((subject) => (
                                                <div key={subject.id} className="border-l-2 border-gray-300">
                                                    {/* Subject Level */}
                                                    <div className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <button
                                                                onClick={() => toggleSubject(subject.id)}
                                                                className="text-gray-600 hover:text-gray-900"
                                                            >
                                                                {expandedSubjects.has(subject.id) ? (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <FolderOpen className="w-4 h-4 text-emerald-600" />
                                                            <span className="font-semibold text-gray-800">{subject.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setChapterForm({ title: '', subjectId: subject.id });
                                                                    setShowChapterModal(true);
                                                                }}
                                                                className="px-3 py-1 text-sm bg-white hover:bg-gray-50 text-emerald-600 border border-emerald-200 rounded font-medium"
                                                            >
                                                                Add Chapter
                                                            </button>
                                                            <button className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-white rounded">
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Chapters */}
                                                    {expandedSubjects.has(subject.id) && subject.chapters && (
                                                        <div className="pl-8 bg-white">
                                                            {subject.chapters.map((chapter) => (
                                                                <div key={chapter.id} className="border-l-2 border-gray-200">
                                                                    <div className="flex items-center justify-between p-2 hover:bg-gray-50 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <button
                                                                                onClick={() => toggleChapter(chapter.id)}
                                                                                className="text-gray-600 hover:text-gray-900"
                                                                            >
                                                                                {expandedChapters.has(chapter.id) ? (
                                                                                    <ChevronDown className="w-4 h-4" />
                                                                                ) : (
                                                                                    <ChevronRight className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                            <FileText className="w-4 h-4 text-purple-600" />
                                                                            <span className="text-gray-700">{chapter.title}</span>
                                                                            {chapter.questionCount !== undefined && (
                                                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                                                    {chapter.questionCount} questions
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setModelForm({ title: '', chapterId: chapter.id });
                                                                                    setShowModelModal(true);
                                                                                }}
                                                                                className="px-2 py-1 text-xs bg-white hover:bg-gray-50 text-purple-600 border border-purple-200 rounded font-medium"
                                                                            >
                                                                                Add Model
                                                                            </button>
                                                                            <button className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded">
                                                                                <Edit className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded">
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Models List */}
                                                                    {expandedChapters.has(chapter.id) && chapter.models && (
                                                                        <div className="pl-8 bg-white pb-2">
                                                                            {chapter.models.map((model) => (
                                                                                <div key={model.id} className="flex items-center justify-between p-2 pl-4 border-l border-gray-100 hover:bg-gray-50 text-sm">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                                                        <span className="text-gray-600">{model.title}</span>
                                                                                        <span className="text-xs text-gray-400">({model.totalQuestions || 0} qs)</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setUploadModelData({ id: model.id, title: model.title });
                                                                                                setShowUploadModal(true);
                                                                                            }}
                                                                                            className="p-1 text-gray-400 hover:text-emerald-600"
                                                                                            title="Bulk Upload Questions"
                                                                                        >
                                                                                            <Upload className="w-3 h-3" />
                                                                                        </button>
                                                                                        <button className="p-1 text-gray-400 hover:text-blue-600">
                                                                                            <Edit className="w-3 h-3" />
                                                                                        </button>
                                                                                        <button className="p-1 text-gray-400 hover:text-red-600">
                                                                                            <Trash2 className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                            {chapter.models.length === 0 && (
                                                                                <div className="pl-4 py-2 text-xs text-gray-400 italic">No models yet</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Exam Modal */}
                {showExamModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {editMode ? 'Edit Exam' : 'Add New Exam'}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Name *</label>
                                    <input
                                        type="text"
                                        value={examForm.title}
                                        onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="e.g., SSC CGL 2024"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={examForm.description}
                                        onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="Brief description of the exam"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateExam}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                >
                                    {editMode ? 'Update' : 'Create'} Exam
                                </button>
                                <button
                                    onClick={() => setShowExamModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subject Modal */}
                {showSubjectModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Subject</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Name *</label>
                                    <input
                                        type="text"
                                        value={subjectForm.title}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                                        placeholder="e.g., Mathematics"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateSubject}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                                >
                                    Create Subject
                                </button>
                                <button
                                    onClick={() => setShowSubjectModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chapter Modal */}
                {showChapterModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Chapter</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chapter Name *</label>
                                    <input
                                        type="text"
                                        value={chapterForm.title}
                                        onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                                        placeholder="e.g., Algebra"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateChapter}
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                                >
                                    Create Chapter
                                </button>
                                <button
                                    onClick={() => setShowChapterModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Model Modal */}
                {showModelModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Model</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Model Title *</label>
                                    <input
                                        type="text"
                                        value={modelForm.title}
                                        onChange={(e) => setModelForm({ ...modelForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                                        placeholder="e.g., Practice Set 1"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateModel}
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                                >
                                    Create Model
                                </button>
                                <button
                                    onClick={() => setShowModelModal(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showUploadModal && uploadModelData && (
                    <UploadModelModal
                        isOpen={showUploadModal}
                        onClose={() => setShowUploadModal(false)}
                        onSuccess={() => {
                            fetchHierarchy(); // Refresh counts
                            // setShowUploadModal(false); // Handled by onClose
                        }}
                        modelId={uploadModelData.id}
                        modelTitle={uploadModelData.title}
                    />
                )}
            </div>
        </div>
    );
}

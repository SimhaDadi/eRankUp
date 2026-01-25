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
    duration?: number;
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
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [editMode, setEditMode] = useState(false);

    const [examForm, setExamForm] = useState({ title: '', description: '' });
    const [subjectForm, setSubjectForm] = useState({ title: '', examId: '' });
    const [chapterForm, setChapterForm] = useState({ title: '', subjectId: '' });
    const [modelForm, setModelForm] = useState({ title: '', chapterId: '', duration: 0 });

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
            const data = Array.isArray(response.data) ? response.data : [];
            // Transform backend response (name) to frontend format (title)
            const transformedData = data.map((exam: any) => ({
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
            if (editMode && selectedExam) {
                await api.put(`/exams/${selectedExam.id}`, examForm);
                alert('Question Bank updated successfully!');
            } else {
                await api.post('/exams', { ...examForm, type: 'question_bank' });
                alert('Question Bank created successfully!');
            }
            setShowExamModal(false);
            setExamForm({ title: '', description: '' });
            setEditMode(false);
            setSelectedExam(null);
            fetchHierarchy();
        } catch (error) {
            console.error('Error saving question bank:', error);
            alert('Failed to save question bank');
        }
    };

    const handleDeleteExam = async (id: string) => {
        if (!confirm('Are you sure you want to delete this Question Bank? All subjects, chapters, and models will be unlinked or deleted.')) return;
        try {
            await api.delete(`/exams/${id}`);
            fetchHierarchy();
            alert('Question Bank deleted successfully!');
        } catch (error) {
            console.error('Error deleting exam:', error);
            alert('Failed to delete question bank');
        }
    }

    const handleCreateSubject = async () => {
        try {
            if (editMode && selectedSubject) {
                await api.put(`/exams/subjects/${selectedSubject.id}`, { name: subjectForm.title });
                alert('Subject updated successfully!');
            } else {
                await api.post('/subjects', { name: subjectForm.title, examId: subjectForm.examId });
                alert('Subject created successfully!');
            }
            setShowSubjectModal(false);
            setSubjectForm({ title: '', examId: '' });
            setEditMode(false);
            setSelectedSubject(null);
            fetchHierarchy();
        } catch (error) {
            console.error('Error saving subject:', error);
            alert('Failed to save subject');
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subject? Chapters will be unlinked.')) return;
        try {
            await api.delete(`/exams/subjects/${id}`);
            fetchHierarchy();
            alert('Subject deleted successfully!');
        } catch (error) {
            console.error('Error deleting subject:', error);
            alert('Failed to delete subject');
        }
    }

    const handleCreateChapter = async () => {
        try {
            if (editMode && selectedChapter) {
                await api.put(`/exams/chapters/${selectedChapter.id}`, { name: chapterForm.title });
                alert('Chapter updated successfully!');
            } else {
                await api.post('/chapters', { name: chapterForm.title, subjectId: chapterForm.subjectId });
                alert('Chapter created successfully!');
            }
            setShowChapterModal(false);
            setChapterForm({ title: '', subjectId: '' });
            setEditMode(false);
            setSelectedChapter(null);
            fetchHierarchy();
        } catch (error) {
            console.error('Error saving chapter:', error);
            alert('Failed to save chapter');
        }
    };

    const handleDeleteChapter = async (id: string) => {
        if (!confirm('Are you sure you want to delete this chapter? Models will be unlinked.')) return;
        try {
            await api.delete(`/exams/chapters/${id}`);
            fetchHierarchy();
            alert('Chapter deleted successfully!');
        } catch (error) {
            console.error('Error deleting chapter:', error);
            alert('Failed to delete chapter');
        }
    }

    const handleCreateModel = async () => {
        try {
            if (editMode && selectedModel) {
                await api.put(`/exams/models/${selectedModel.id}`, { title: modelForm.title, duration: modelForm.duration });
                alert('Model updated successfully!');
            } else {
                await api.post(`/exams/chapters/${modelForm.chapterId}/models`, { title: modelForm.title, duration: modelForm.duration });
                alert('Model created successfully!');
            }
            setShowModelModal(false);
            setModelForm({ title: '', chapterId: '', duration: 0 });
            setEditMode(false);
            setSelectedModel(null);
            fetchHierarchy();
        } catch (error) {
            console.error('Error saving model:', error);
            alert('Failed to save model');
        }
    };

    const handleDeleteModel = async (id: string) => {
        if (!confirm('Are you sure you want to delete this model?')) return;
        try {
            await api.delete(`/exams/models/${id}`);
            fetchHierarchy();
            alert('Model deleted successfully!');
        } catch (error) {
            console.error('Error deleting model:', error);
            alert('Failed to delete model');
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Content Hierarchy</h1>
                        <p className="text-gray-600">Manage structure: Question Banks &gt; Subjects &gt; Chapters</p>
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
                        Add Question Bank
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Question Banks yet</h3>
                            <p className="text-gray-500 mb-4">Create your first Question Bank to get started</p>
                            <button
                                onClick={() => setShowExamModal(true)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                Add Question Bank
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
                                            <button
                                                onClick={() => {
                                                    setEditMode(true);
                                                    setSelectedExam(exam);
                                                    setExamForm({ title: exam.title, description: exam.description || '' });
                                                    setShowExamModal(true);
                                                }}
                                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExam(exam.id)}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded"
                                            >
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
                                                            <button
                                                                onClick={() => {
                                                                    setEditMode(true);
                                                                    setSelectedSubject(subject);
                                                                    setSubjectForm({ title: subject.title, examId: exam.id });
                                                                    setShowSubjectModal(true);
                                                                }}
                                                                className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-white rounded"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSubject(subject.id)}
                                                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded"
                                                            >
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
                                                                                    setModelForm({ title: '', chapterId: chapter.id, duration: 0 });
                                                                                    setShowModelModal(true);
                                                                                }}
                                                                                className="px-2 py-1 text-xs bg-white hover:bg-gray-50 text-purple-600 border border-purple-200 rounded font-medium"
                                                                            >
                                                                                Add Model
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditMode(true);
                                                                                    setSelectedChapter(chapter);
                                                                                    setChapterForm({ title: chapter.title, subjectId: subject.id });
                                                                                    setShowChapterModal(true);
                                                                                }}
                                                                                className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded"
                                                                            >
                                                                                <Edit className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteChapter(chapter.id)}
                                                                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                                                                            >
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
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditMode(true);
                                                                                                setSelectedModel(model);
                                                                                                setModelForm({ title: model.title, chapterId: chapter.id, duration: model.duration || 0 });
                                                                                                setShowModelModal(true);
                                                                                            }}
                                                                                            className="p-1 text-gray-400 hover:text-blue-600"
                                                                                        >
                                                                                            <Edit className="w-3 h-3" />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDeleteModel(model.id)}
                                                                                            className="p-1 text-gray-400 hover:text-red-600"
                                                                                        >
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
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{editMode ? 'Edit Subject' : 'Add New Subject'}</h2>
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
                                    {editMode ? 'Update' : 'Create'} Subject
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSubjectModal(false);
                                        setEditMode(false);
                                        setSelectedSubject(null);
                                    }}
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
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{editMode ? 'Edit Chapter' : 'Add New Chapter'}</h2>
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
                                    {editMode ? 'Update' : 'Create'} Chapter
                                </button>
                                <button
                                    onClick={() => {
                                        setShowChapterModal(false);
                                        setEditMode(false);
                                        setSelectedChapter(null);
                                    }}
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
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{editMode ? 'Edit Model' : 'Add New Model'}</h2>
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
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Min) (Optional)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={modelForm.duration}
                                        onChange={(e) => setModelForm({ ...modelForm, duration: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                                        placeholder="0 (Inherit from Exam)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave 0 to use Exam default duration.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateModel}
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                                >
                                    {editMode ? 'Update' : 'Create'} Model
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModelModal(false);
                                        setEditMode(false);
                                        setSelectedModel(null);
                                    }}
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

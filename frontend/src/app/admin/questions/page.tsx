'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Upload, Search, Filter, Edit, Trash2, Eye, Download, FileText,
    CheckCircle, XCircle, AlertCircle, X, Copy, Image as ImageIcon, Lightbulb
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import api from '@/lib/api';
import TestBuilder from '@/components/admin/TestBuilder';

// ==================== TYPESCRIPT INTERFACES ====================
interface Exam {
    id: string;
    title: string;
    type: 'real_exam' | 'question_bank';
}

interface Subject {
    id: string;
    title: string;
}

interface Chapter {
    id: string;
    title: string;
}

interface Question {
    id: string;
    content: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    topic: string;
    difficultyWeight: number;
    subject?: { id: string; title: string };
    chapter?: { id: string; title: string };
    exams: Exam[];
    explanation?: string;
}

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface DuplicateCheckResult {
    totalChecked: number;
    duplicatesFound: number;
    duplicates: Array<{
        content: string;
        existingId: string;
    }>;
}

interface UploadResult {
    importedCount?: number;
    errors?: string[];
}

interface MediaFile {
    id: string;
    filename: string;
    originalName: string;
    url: string;
}

// ==================== MAIN COMPONENT ====================
export default function QuestionManagementPage() {
    const [activeTab, setActiveTab] = useState<'add' | 'bulk' | 'list' | 'quality' | 'utilities' | 'builder'>('list');

    return (
        <div className="space-y-8 pb-10" style={{ colorScheme: 'dark' }}>
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Question Management
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Unified interface for all question operations
                </p>
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-slate-900/40 p-1 rounded-xl w-fit border border-slate-800/50 flex-wrap">
                <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')} label="Question List" icon={FileText} />
                <TabButton active={activeTab === 'add'} onClick={() => setActiveTab('add')} label="Add Question" icon={Plus} />
                <TabButton active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')} label="Bulk Upload" icon={Upload} />
                <TabButton active={activeTab === 'builder'} onClick={() => setActiveTab('builder')} label="Test Builder" icon={Lightbulb} />
                <TabButton active={activeTab === 'quality'} onClick={() => setActiveTab('quality')} label="Quality Control" icon={CheckCircle} />
                <TabButton active={activeTab === 'utilities'} onClick={() => setActiveTab('utilities')} label="Utilities" icon={Download} />
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'list' && <QuestionListTab key="list" />}
                {activeTab === 'add' && <AddQuestionTab key="add" />}
                {activeTab === 'bulk' && <BulkUploadTab key="bulk" />}
                {activeTab === 'builder' && <TestBuilder key="builder" />}
                {activeTab === 'quality' && <QualityControlTab key="quality" />}
                {activeTab === 'utilities' && <UtilitiesTab key="utilities" />}
            </AnimatePresence>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            role="tab"
            aria-selected={active}
            aria-label={label}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

// ==================== QUESTION LIST TAB ====================
function QuestionListTab() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.topic = searchQuery;
            if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

            const response = await api.get('/questions/global', { params });
            setQuestions(response.data);
        } catch (error) {
            console.error("Failed to load questions", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedDifficulty]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <div className="mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="py-12 text-center text-slate-500">Loading questions...</div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <p className="text-lg font-medium">No questions found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {questions.map((q) => (
                                <div key={q.id} className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <p className="text-white font-medium mb-2">{q.content}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {q.exams?.map(ex => (
                                                    <span key={ex.id} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] uppercase font-bold">
                                                        {ex.title}
                                                    </span>
                                                ))}
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[10px] uppercase font-bold">
                                                    {q.topic}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    // Implementation for edit would go here
                                                    // For now just alert or switch tab with pre-fill
                                                    alert('Edit functionality activated for: ' + q.id);
                                                }}
                                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to delete this question?')) {
                                                        try {
                                                            await api.delete(`/questions/${q.id}`);
                                                            fetchQuestions();
                                                        } catch (e) {
                                                            alert('Failed to delete question');
                                                        }
                                                    }
                                                }}
                                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ==================== ADD QUESTION TAB ====================
function AddQuestionTab() {
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loadingExams, setLoadingExams] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        questionText: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correctAnswer: 0,
        topic: '',
        difficulty: 'medium',
        examIds: [] as string[],
        subjectId: '',
        chapterId: '',
        explanation: ''
    });

    const fetchExams = useCallback(async () => {
        setLoadingExams(true);
        setError(null);
        try {
            const response = await api.get('/exams');
            setExams(response.data);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to load exams';
            setError(message);
            console.error('Error fetching exams:', error);
        } finally {
            setLoadingExams(false);
        }
    }, []);

    const fetchSubjects = useCallback(async (examId: string) => {
        setLoadingSubjects(true);
        setError(null);
        try {
            const response = await api.get(`/subjects/by-exam/${examId}`);
            setSubjects(response.data);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to load subjects';
            setError(message);
            console.error('Error fetching subjects:', error);
        } finally {
            setLoadingSubjects(false);
        }
    }, []);

    const fetchChapters = useCallback(async (subjectId: string) => {
        setLoadingChapters(true);
        setError(null);
        try {
            const response = await api.get(`/chapters/by-subject/${subjectId}`);
            setChapters(response.data);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to load chapters';
            setError(message);
            console.error('Error fetching chapters:', error);
        } finally {
            setLoadingChapters(false);
        }
    }, []);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    useEffect(() => {
        if (selectedExamId) {
            fetchSubjects(selectedExamId);
        } else {
            setSubjects([]);
            setChapters([]);
        }
    }, [selectedExamId, fetchSubjects]);

    useEffect(() => {
        if (selectedSubjectId) {
            fetchChapters(selectedSubjectId);
        } else {
            setChapters([]);
        }
    }, [selectedSubjectId, fetchChapters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const questionData = {
                questionText: formData.questionText,
                options: [formData.option1, formData.option2, formData.option3, formData.option4],
                correctAnswer: formData.correctAnswer,
                topic: formData.topic,
                difficulty: formData.difficulty,
                subjectId: formData.subjectId,
                exams: formData.examIds.map(id => ({ id })),
                chapterId: formData.chapterId,
                explanation: formData.explanation
            };

            await api.post('/questions', questionData);

            // Success - reset form
            setFormData({
                questionText: '',
                option1: '',
                option2: '',
                option3: '',
                option4: '',
                correctAnswer: 0,
                topic: '',
                difficulty: 'medium',
                subjectId: '',
                examIds: [],
                chapterId: '',
                explanation: ''
            });
            setSelectedExamId('');
            setSelectedSubjectId('');

            // Show success message
            alert('Question added successfully!');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to add question';
            setError(message);
            console.error('Error adding question:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-3xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Question Text */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                            Question Text *
                        </label>
                        <textarea
                            required
                            value={formData.questionText}
                            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="Enter the question text..."
                        />
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((num) => (
                            <div key={num}>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Option {num} *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData[`option${num}` as keyof typeof formData]}
                                    onChange={(e) => setFormData({ ...formData, [`option${num}`]: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                                    placeholder={`Enter option ${num}...`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Correct Answer */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Correct Answer *
                        </label>
                        <select
                            required
                            value={formData.correctAnswer}
                            onChange={(e) => setFormData({ ...formData, correctAnswer: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        >
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={0}>Option 1</option>
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={1}>Option 2</option>
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={2}>Option 3</option>
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={3}>Option 4</option>
                        </select>
                    </div>

                    {/* Hierarchy Selectors */}
                    <div className="space-y-6">
                        {/* Exam Selection (Multi-select) */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">
                                Connect to Exams * <span className="text-xs font-normal text-slate-500">(Select all that apply)</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-950 p-4 border border-slate-800 rounded-2xl max-h-48 overflow-y-auto">
                                {exams.map(exam => (
                                    <label key={exam.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900 cursor-pointer border border-transparent hover:border-slate-800 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0"
                                            checked={formData.examIds.includes(exam.id)}
                                            onChange={(e) => {
                                                const newIds = e.target.checked
                                                    ? [...formData.examIds, exam.id]
                                                    : formData.examIds.filter(id => id !== exam.id);
                                                setFormData({ ...formData, examIds: newIds });

                                                // Set the first exam as the 'context' for subjects/chapters if none selected
                                                if (newIds.length > 0 && !selectedExamId) {
                                                    setSelectedExamId(newIds[0]);
                                                }
                                            }}
                                        />
                                        <span className="text-xs font-medium text-slate-300 truncate">{exam.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Hierarchy Context (for Subject/Chapter selection) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Hierarchy Context (Exam Pool) *</label>
                                <select
                                    required
                                    value={selectedExamId}
                                    onChange={(e) => {
                                        setSelectedExamId(e.target.value);
                                        setFormData({ ...formData, subjectId: '', chapterId: '' });
                                        setSelectedSubjectId('');
                                    }}
                                    disabled={loadingExams}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    style={{ backgroundColor: '#020617', color: 'white' }}
                                >
                                    <option style={{ backgroundColor: '#020617', color: 'white' }} value="">Select Exam for Pool</option>
                                    {exams.filter(e => formData.examIds.includes(e.id)).map(exam => (
                                        <option style={{ backgroundColor: '#020617', color: 'white' }} key={exam.id} value={exam.id}>{exam.title}</option>
                                    ))}
                                    {formData.examIds.length === 0 && exams.map(exam => (
                                        <option style={{ backgroundColor: '#020617', color: 'white' }} key={exam.id} value={exam.id}>{exam.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Subject *</label>
                                <select
                                    required
                                    value={selectedSubjectId}
                                    onChange={(e) => {
                                        setSelectedSubjectId(e.target.value);
                                        setFormData({ ...formData, subjectId: e.target.value, chapterId: '' });
                                    }}
                                    disabled={!selectedExamId || loadingSubjects}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    style={{ backgroundColor: '#020617', color: 'white' }}
                                >
                                    <option style={{ backgroundColor: '#020617', color: 'white' }} value="">{loadingSubjects ? 'Loading...' : 'Select Subject'}</option>
                                    {subjects.map(subject => (
                                        <option style={{ backgroundColor: '#020617', color: 'white' }} key={subject.id} value={subject.id}>{subject.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Chapter *</label>
                                <select
                                    required
                                    value={formData.chapterId}
                                    onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                                    disabled={!selectedSubjectId || loadingChapters}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    style={{ backgroundColor: '#020617', color: 'white' }}
                                >
                                    <option style={{ backgroundColor: '#020617', color: 'white' }} value="">{loadingChapters ? 'Loading...' : 'Select Chapter'}</option>
                                    {chapters.map(chapter => (
                                        <option style={{ backgroundColor: '#020617', color: 'white' }} key={chapter.id} value={chapter.id}>{chapter.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Topic & Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Topic *</label>
                            <input
                                required
                                type="text"
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                                placeholder="e.g., Algebra, Grammar, etc."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Difficulty *</label>
                            <select
                                required
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            >
                                <option style={{ backgroundColor: '#020617', color: 'white' }} value="easy">Easy</option>
                                <option style={{ backgroundColor: '#020617', color: 'white' }} value="medium">Medium</option>
                                <option style={{ backgroundColor: '#020617', color: 'white' }} value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Explanation (Optional)
                        </label>
                        <textarea
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            placeholder="Explain the correct answer..."
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Add Question
                            </>
                        )}
                    </button>
                </form>
            </div>
        </motion.div>
    );
}

// ==================== BULK UPLOAD TAB ====================
function BulkUploadTab() {
    const [loading, setLoading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/questions/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Successfully uploaded ${response.data.importedCount} questions!`);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to upload questions';
            setError(message);
            console.error('Error uploading questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrProcessing(true);
        setExtractedText('');
        setError(null);

        try {
            if (file.type === 'application/pdf') {
                setError('PDF OCR processing will be implemented with backend support');
            } else if (file.type.startsWith('image/')) {
                const worker = await createWorker('eng');
                const { data: { text } } = await worker.recognize(file);
                await worker.terminate();

                setExtractedText(text);
            }
        } catch (error: any) {
            setError('Failed to extract text from file');
            console.error('OCR Error:', error);
        } finally {
            setOcrProcessing(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* CSV/Excel Upload */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                    <FileText className="w-12 h-12 mb-4 text-blue-400" />
                    <h3 className="text-xl font-bold text-white mb-2">CSV / Excel Upload</h3>
                    <p className="text-sm text-slate-400 mb-4">Structured data format (recommended)</p>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleBulkUpload}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Upload CSV or Excel file"
                        />
                        <button
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Choose CSV/Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* PDF/Image Upload with OCR */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                    <Eye className="w-12 h-12 mb-4 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white mb-2">PDF / Image Upload</h3>
                    <p className="text-sm text-slate-400 mb-4">OCR text extraction (AI-powered)</p>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleOCRUpload}
                            disabled={ocrProcessing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Upload PDF or image file for OCR"
                        />
                        <button
                            disabled={ocrProcessing}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            {ocrProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Choose PDF/Image
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* OCR Processing Status */}
            {ocrProcessing && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-semibold text-blue-400">Processing with OCR...</span>
                    </div>
                </div>
            )}

            {/* Extracted Text Preview */}
            {extractedText && (
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
                    <h4 className="font-bold text-white mb-4">Extracted Text Preview</h4>
                    <div className="bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap">{extractedText}</pre>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ==================== QUALITY CONTROL TAB ====================
function QualityControlTab() {
    const [text, setText] = useState('');
    const [result, setResult] = useState<DuplicateCheckResult | null>(null);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async () => {
        if (!text.trim()) return;

        setChecking(true);
        setError(null);
        try {
            const questions = text.split(/\n/).filter(line => line.trim().length > 0);
            const res = await api.post('/admin/content/duplicates', { questions });
            setResult(res.data);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to check duplicates';
            setError(message);
            console.error('Error checking duplicates:', error);
        } finally {
            setChecking(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <h2 className="text-xl font-bold text-white mb-4">Paste Content to Check</h2>
                <p className="text-sm text-slate-400 mb-4">Paste question texts (one per line) to check if they already exist in the database.</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm">{error}</span>
                    </div>
                )}

                <textarea
                    className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 resize-none text-sm font-mono"
                    placeholder="Paste questions here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    aria-label="Questions to check for duplicates"
                />
                <button
                    onClick={handleCheck}
                    disabled={checking || !text.trim()}
                    className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                    {checking ? 'Checking...' : 'Check for Duplicates'}
                </button>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <h2 className="text-xl font-bold text-white mb-4">Results</h2>
                {result ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                            <div>
                                <div className="text-sm text-slate-400">Total Checked</div>
                                <div className="text-2xl font-bold text-white">{result.totalChecked}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">Duplicates Found</div>
                                <div className={`text-2xl font-bold ${result.duplicatesFound > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {result.duplicatesFound}
                                </div>
                            </div>
                        </div>

                        {result.duplicates.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {result.duplicates.map((dup, i) => (
                                    <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <div className="text-xs text-red-300 font-bold mb-1">Potential Duplicate</div>
                                        <div className="text-sm text-white">{dup.content}</div>
                                        <div className="text-xs text-slate-500 mt-2">Matches ID: {dup.existingId}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-emerald-400">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="font-bold">No duplicates found</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                        Results will appear here
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ==================== UTILITIES TAB ====================
function UtilitiesTab() {
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMedia = useCallback(async () => {
        setLoadingMedia(true);
        try {
            const res = await api.get('/admin/media');
            setMedia(res.data);
        } catch (error: any) {
            console.error('Failed to fetch media:', error);
        } finally {
            setLoadingMedia(false);
        }
    }, []);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadStatus('uploading');
        setError(null);
        try {
            const res = await api.post('/admin/content/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadResult(res.data);
            setUploadStatus('success');
        } catch (error: any) {
            setUploadStatus('error');
            const message = error.response?.data?.message || 'Upload failed';
            setUploadResult({ errors: [message] });
            setError(message);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1
    });

    const handleDownload = async () => {
        try {
            const res = await api.get('/admin/content/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `questions_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to download questions';
            setError(message);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/admin/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchMedia();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Upload failed';
            setError(message);
        }
    };

    const handleMediaDelete = async (id: string) => {
        if (!confirm('Delete this file?')) return;
        try {
            await api.delete(`/admin/media/${id}`);
            fetchMedia();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Delete failed';
            setError(message);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Import/Export Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Import */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-400" />
                        Bulk Import
                    </h2>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-slate-300 font-medium mb-1">
                            {isDragActive ? "Drop CSV here..." : "Drag & drop CSV file"}
                        </p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                    </div>

                    {uploadStatus !== 'idle' && (
                        <div className={`mt-6 p-4 rounded-xl border ${uploadStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                            uploadStatus === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-slate-700'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {uploadStatus === 'uploading' && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                                {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                <span className="font-bold text-white">
                                    {uploadStatus === 'uploading' ? 'Importing questions...' :
                                        uploadStatus === 'success' ? 'Import Successful!' : 'Import Failed'}
                                </span>
                            </div>

                            {uploadResult && (
                                <div className="text-sm space-y-1">
                                    {uploadResult.importedCount !== undefined && (
                                        <p className="text-emerald-400">Successfully imported {uploadResult.importedCount} questions.</p>
                                    )}
                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                        <div className="mt-2 p-2 bg-black/20 rounded max-h-32 overflow-y-auto">
                                            <p className="text-red-400 font-bold mb-1">Errors:</p>
                                            {uploadResult.errors.map((err, i) => (
                                                <div key={i} className="text-red-300 text-xs">{err}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Export */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl h-fit">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-purple-400" />
                        Export Data
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Download all questions in the database as a CSV file. Useful for backups or bulk editing.
                    </p>
                    <button
                        onClick={handleDownload}
                        className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download All Questions
                    </button>
                </div>
            </div>

            {/* AI Explanation Generator */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    AI Explanation Generator
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                    Generate AI-powered explanations for questions that don't have them yet. This uses advanced AI to create structured, educational explanations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Exam</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            aria-label="Select exam for explanation generation"
                        >
                            <option value="">All Exams</option>
                        </select>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            aria-label="Select subject for explanation generation"
                        >
                            <option value="">All Subjects</option>
                        </select>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Chapter</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            aria-label="Select chapter for explanation generation"
                        >
                            <option value="">All Chapters</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-300">
                            <p className="font-semibold mb-1">How it works:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>AI analyzes each question and generates a structured explanation</li>
                                <li>Explanations include: why the answer is correct, why others are wrong, key concepts, and common mistakes</li>
                                <li>Processing time: ~2-3 seconds per question</li>
                                <li>Requires GEMINI_API_KEY to be configured</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        if (!confirm('Generate AI explanations for questions without explanations? This may take several minutes.')) return;
                        try {
                            const res = await api.post('/explanations/bulk-generate', {});
                            alert(`Success! Generated ${res.data.generated} explanations.`);
                        } catch (error: any) {
                            const message = error.response?.data?.message || 'Failed to generate explanations';
                            setError(message);
                        }
                    }}
                    className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold hover:from-yellow-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                    <Lightbulb className="w-4 h-4" />
                    Generate Explanations
                </button>
            </div>

            {/* Media Library */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Media Library</h2>
                        <p className="text-sm text-slate-400">Manage uploaded images and assets</p>
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload New
                        <input type="file" className="hidden" accept="image/*" onChange={handleMediaUpload} />
                    </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {loadingMedia ? (
                        [...Array(5)].map((_, i) => <div key={i} className="aspect-square bg-slate-900/40 rounded-xl animate-pulse" />)
                    ) : media.length > 0 ? (
                        media.map((item) => (
                            <div key={item.id} className="group relative aspect-square bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                    <ImageIcon className="w-8 h-8 opacity-20" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-xs text-white font-medium truncate">{item.filename}</p>
                                    <div className="flex justify-end mt-2 gap-2">
                                        <button
                                            onClick={() => handleMediaDelete(item.id)}
                                            className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white"
                                            aria-label={`Delete ${item.filename}`}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            No media files found.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

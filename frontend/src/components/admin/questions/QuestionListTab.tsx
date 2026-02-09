import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Edit, Trash2, Download } from 'lucide-react';
import api from '@/lib/api';
import { Question } from './types';
import EditQuestionModal from '../EditQuestionModal';
import MathRenderer from '@/components/common/MathRenderer';

export default function QuestionListTab() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    // Hierarchical Filters
    const [filters, setFilters] = useState({ examId: '', subjectId: '', chapterId: '', modelId: '' });
    const [exams, setExams] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [chapters, setChapters] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);

    // Fetch Exams on mount
    useEffect(() => {
        api.get('/exams').then(res => {
            const data = res.data.data || res.data; // Handle pagination wrapper
            setExams(Array.isArray(data) ? data : []);
        });
    }, []);

    // Fetch Subjects - Global or Exam-specific
    useEffect(() => {
        if (filters.examId) {
            api.get(`/exams/${filters.examId}/subjects`).then(res => setSubjects(res.data));
        } else {
            api.get('/exams/subjects/all').then(res => {
                const data = Array.isArray(res.data) ? res.data : (res.data.subjects || []);
                setSubjects(data);
            });
        }
    }, [filters.examId]);

    // Fetch Chapters when Subject changes
    useEffect(() => {
        if (filters.subjectId) {
            api.get(`/exams/subjects/${filters.subjectId}/chapters`).then(res => setChapters(res.data));
        } else {
            setChapters([]);
        }
    }, [filters.subjectId]);

    // Fetch Models when Chapter changes
    useEffect(() => {
        if (filters.chapterId) {
            api.get(`/exams/chapters/${filters.chapterId}/models`).then(res => setModels(res.data));
        } else {
            setModels([]);
        }
    }, [filters.chapterId]);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (filters.examId) params.examId = filters.examId;
            if (filters.subjectId) params.subjectId = filters.subjectId;
            if (filters.chapterId) params.chapterId = filters.chapterId;
            if (filters.modelId) params.modelId = filters.modelId;
            if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

            const response = await api.get('/exams/questions/global', { params });
            // Handle both array (legacy) and paginated object responses
            const data = response.data.questions || response.data;
            setQuestions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load questions", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedDifficulty, filters]);

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.examId) params.append('examId', filters.examId);
            if (filters.subjectId) params.append('subjectId', filters.subjectId);
            if (filters.chapterId) params.append('chapterId', filters.chapterId);
            if (filters.modelId) params.append('modelId', filters.modelId);

            const response = await api.get(`/questions/export?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // Removed manual 'download' attribute to respect 'Content-Disposition' from server
            const contentDisposition = response.headers['content-disposition'];
            let filename = `questions_backup_${new Date().toISOString().split('T')[0]}.csv`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename=(.+)/);
                if (filenameMatch.length === 2)
                    filename = filenameMatch[1].replace(/['"]/g, ''); // strip quotes
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export backup");
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-1">
                    <select
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        value={filters.examId}
                        onChange={(e) => setFilters(prev => ({ ...prev, examId: e.target.value, subjectId: '', chapterId: '', modelId: '' }))}
                    >
                        <option value="">All Question Banks</option>
                        {exams.map((ex: any) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <select
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={filters.subjectId}
                        onChange={(e) => setFilters(prev => ({ ...prev, subjectId: e.target.value, chapterId: '', modelId: '' }))}
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((sub: any) => <option key={sub.id} value={sub.id}>{sub.title}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <select
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={filters.chapterId}
                        onChange={(e) => setFilters(prev => ({ ...prev, chapterId: e.target.value, modelId: '' }))}
                        disabled={!filters.subjectId}
                    >
                        <option value="">All Chapters</option>
                        {chapters.map((chap: any) => <option key={chap.id} value={chap.id}>{chap.title}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <select
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        value={filters.modelId}
                        onChange={(e) => setFilters(prev => ({ ...prev, modelId: e.target.value }))}
                        disabled={!filters.chapterId}
                    >
                        <option value="">All Models</option>
                        {models.map((mod: any) => <option key={mod.id} value={mod.id}>{mod.title}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1 relative flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        title="Export Backup"
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-lg"
                    >
                        <Download className="w-5 h-5" />
                    </button>
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
                                        <MathRenderer
                                            content={q.content}
                                            className="text-white font-medium mb-2 !prose-sm"
                                        />
                                        {q.imageUrl && (
                                            <div className="mb-3">
                                                <img
                                                    src={`${process.env.NEXT_PUBLIC_API_URL}${q.imageUrl}`}
                                                    alt="Question Diagram"
                                                    className="max-h-48 rounded-lg border border-slate-800"
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {q.exams?.map(ex => (
                                                <span key={ex.id} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] uppercase font-bold">
                                                    {ex.title}
                                                </span>
                                            ))}
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[10px] uppercase font-bold">
                                                {q.chapter?.title || q.topic}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingQuestion(q)}
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

            {editingQuestion && (
                <EditQuestionModal
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    onSuccess={() => {
                        fetchQuestions();
                        setEditingQuestion(null);
                    }}
                    question={editingQuestion}
                />
            )}
        </motion.div>
    );
}

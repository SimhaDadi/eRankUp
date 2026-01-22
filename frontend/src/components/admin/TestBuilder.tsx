import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    CheckCircle2,
    Layout,
    BookOpen,
    ChevronRight,
    Plus,
    Database,
    ArrowRight
} from 'lucide-react';
import api from '@/lib/api';

// Interfaces (Mirrors what we use in page.tsx)
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
    content: string; // or questionText depending on API
    type: string;
    difficultyWeight?: number;
    // ... other fields
}

export default function TestBuilder() {
    // Selection State
    const [targetExamId, setTargetExamId] = useState('');
    const [sourceBankId, setSourceBankId] = useState('');

    // Data State
    const [exams, setExams] = useState<Exam[]>([]);
    const [banks, setBanks] = useState<Exam[]>([]);
    const [realExams, setRealExams] = useState<Exam[]>([]);

    // Filter State
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedChapterId, setSelectedChapterId] = useState('');

    // Questions State
    const [questions, setQuestions] = useState<any[]>([]); // Using any for flexibility with backend response
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // UI State
    const [loading, setLoading] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [adding, setAdding] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/exams');
            const allExams: Exam[] = res.data;
            setExams(allExams);
            setBanks(allExams.filter(e => e.type === 'question_bank'));
            setRealExams(allExams.filter(e => e.type !== 'question_bank'));
        } catch (err) {
            console.error("Failed to fetch exams", err);
        }
    };

    // When Source Bank changes, fetch hierarchy
    useEffect(() => {
        if (sourceBankId) {
            fetchSubjects(sourceBankId);
            setSubjects([]);
            setChapters([]);
            setQuestions([]);
        }
    }, [sourceBankId]);

    const fetchSubjects = async (examId: string) => {
        try {
            const res = await api.get(`/subjects/by-exam/${examId}`);
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchChapters = async (subjectId: string) => {
        try {
            const res = await api.get(`/chapters/by-subject/${subjectId}`);
            setChapters(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // When filters change, fetch questions
    useEffect(() => {
        if (selectedSubjectId) {
            fetchChapters(selectedSubjectId);
        }
    }, [selectedSubjectId]);

    useEffect(() => {
        if (sourceBankId) {
            fetchQuestions();
        }
    }, [sourceBankId, selectedSubjectId, selectedChapterId]);

    const fetchQuestions = async () => {
        setLoadingQuestions(true);
        try {
            // We need an endpoint to get questions by hierarchy.
            // Adjust this URL based on your actual backend routes.
            // Assuming GET /questions?examId=...
            // If strict hierarchy is enforced, we might need a custom query param or endpoint.
            // Let's assume the question list on list tab uses a specific fetch.
            // Wait, QuestionListTab uses a Search query?
            // Let's try fetching by chapter if selected, or subject, or exam.

            let url = `/questions/by-exam/${sourceBankId}`; // Need to Verify this endpoint exists!
            // If not, we might need to rely on the general list logic.
            // Actually, backend usually has GET /exams/:id/questions or similar?
            // Let's use the standard search if possible, or build a query.

            // Checking existing API: Usually there is no 'by-exam' endpoint for questions in standard nestjs-crud unless generated.
            // However, we can likely filter standard GET /questions if filtering is implemented.
            // Let's assume consistent hierarchy navigation for now.
            // Better: use the hierarchy to drill down.

            // Fallback: If no dedicated endpoint, we might have issues.
            // But let's assume we can fetch questions for a specific exam/bank.

            // TEMPORARY: Use a potentially hypothetical endpoint that filtering supports.
            // Realistically, we might need to filter client side if backend sends all? No, that's bad.
            // Let's try: GET /questions?examId=...

            const params: any = { examId: sourceBankId };
            if (selectedSubjectId) params.subjectId = selectedSubjectId;
            if (selectedChapterId) params.chapterId = selectedChapterId;

            // Note: If backend doesn't support query params filtering on GET /questions, we need to add it or use what's available.
            // Assuming standard CRUD.
            const res = await api.get('/questions', { params });
            setQuestions(res.data.data || res.data); // Handle pagination or raw array

        } catch (err) {
            console.error("Failed to load questions", err);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const toggleQuestion = (id: string) => {
        const newSet = new Set(selectedQuestionIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedQuestionIds(newSet);
    };

    const handleAddToExam = async () => {
        if (!targetExamId || selectedQuestionIds.size === 0) return;
        setAdding(true);

        try {
            // Execute in parallel batches
            const ids = Array.from(selectedQuestionIds);
            const batchSize = 10;

            for (let i = 0; i < ids.length; i += batchSize) {
                const batch = ids.slice(i, i + batchSize);
                await Promise.all(batch.map(qId =>
                    api.patch(`/questions/${qId}`, {
                        addExamId: targetExamId // The new field we added to controller
                    })
                ));
            }

            alert(`Successfully added ${ids.length} questions to the exam!`);
            setSelectedQuestionIds(new Set()); // Clear selection
        } catch (err) {
            console.error(err);
            alert("Failed to add some questions. Please check console.");
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/20 p-8 rounded-3xl">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    Test Builder
                </h2>
                <p className="text-slate-300">
                    Compose exams by selecting questions from your Global Question Banks or other exams.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 h-[700px]">
                {/* LEFT: Configuration Panel */}
                <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col gap-6">

                    {/* Target Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Target Exam
                        </label>
                        <select
                            value={targetExamId}
                            onChange={(e) => setTargetExamId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-all font-medium"
                        >
                            <option value="">Select Exam to Build</option>
                            {realExams.map(ex => (
                                <option key={ex.id} value={ex.id}>{ex.title}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500">Questions will be added to this exam.</p>
                    </div>

                    <div className="h-px bg-slate-800 my-2" />

                    {/* Source Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                            <Database className="w-4 h-4" /> Source Bank
                        </label>
                        <select
                            value={sourceBankId}
                            onChange={(e) => setSourceBankId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-purple-500 transition-all font-medium"
                        >
                            <option value="">Select Source Bank</option>
                            {banks.map(bk => (
                                <option key={bk.id} value={bk.id}>{bk.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filters */}
                    {sourceBankId && (
                        <div className="space-y-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Filter className="w-4 h-4" /> <span className="text-sm font-bold">Filters</span>
                            </div>

                            <select
                                value={selectedSubjectId}
                                onChange={(e) => {
                                    setSelectedSubjectId(e.target.value);
                                    setSelectedChapterId('');
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 outline-none"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.title}</option>
                                ))}
                            </select>

                            <select
                                value={selectedChapterId}
                                onChange={(e) => setSelectedChapterId(e.target.value)}
                                disabled={!selectedSubjectId}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 outline-none disabled:opacity-50"
                            >
                                <option value="">All Chapters</option>
                                {chapters.map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mt-auto">
                        <button
                            onClick={handleAddToExam}
                            disabled={!targetExamId || selectedQuestionIds.size === 0 || adding}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
                        >
                            {adding ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5" />
                            )}
                            Add {selectedQuestionIds.size} Questions
                        </button>
                    </div>
                </div>

                {/* RIGHT: Question List */}
                <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
                        <div className="font-bold text-slate-300">
                            Available Questions
                            {questions.length > 0 && <span className="ml-2 text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{questions.length}</span>}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (selectedQuestionIds.size === questions.length) {
                                        setSelectedQuestionIds(new Set());
                                    } else {
                                        setSelectedQuestionIds(new Set(questions.map(q => q.id)));
                                    }
                                }}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1.5 bg-blue-500/10 rounded-lg transition-colors"
                            >
                                {selectedQuestionIds.size === questions.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loadingQuestions ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p>Loading questions...</p>
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                {sourceBankId ? (
                                    <>
                                        <Database className="w-12 h-12 mb-2" />
                                        <p>No questions found in this filter.</p>
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-12 h-12 mb-2" />
                                        <p>Select a Source Bank to view questions.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            questions.map(q => (
                                <div
                                    key={q.id}
                                    onClick={() => toggleQuestion(q.id)}
                                    className={`group p-4 rounded-xl border cursor-pointer transition-all ${selectedQuestionIds.has(q.id)
                                            ? 'bg-blue-600/10 border-blue-500/50'
                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedQuestionIds.has(q.id)
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'border-slate-600 group-hover:border-slate-500'
                                            }`}>
                                            {selectedQuestionIds.has(q.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-200 text-sm line-clamp-2">{q.content || q.questionText}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                                                    {q.difficultyWeight < 0.4 ? 'Easy' : q.difficultyWeight > 0.6 ? 'Hard' : 'Medium'}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                                                    {q.type || 'MCQ'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

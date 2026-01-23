'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Info, Flag, Shield, Menu, X, User } from 'lucide-react';
import api from '@/lib/api';
import MathRenderer from '@/components/MathRenderer';

interface Question {
    id: string;
    content: string;
    options: { id: string; text: string }[];
    topic?: string;
}

export default function TestPage() {
    const params = useParams();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flags, setFlags] = useState<string[]>([]);
    const [visited, setVisited] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes default

    // Sections Logic
    const sections = useMemo(() => {
        const groups: Record<string, number[]> = {};
        questions.forEach((q, idx) => {
            const topic = q.topic || 'General';
            if (!groups[topic]) groups[topic] = [];
            groups[topic].push(idx);
        });
        return Object.keys(groups).map(name => ({
            name,
            indices: groups[name],
            firstIndex: groups[name][0]
        }));
    }, [questions]);

    const [activeSection, setActiveSection] = useState<string>('');

    // Set initial section
    useEffect(() => {
        if (sections.length > 0 && !activeSection) {
            setActiveSection(sections[0].name);
        }
    }, [sections]);

    // Update active section based on current question
    useEffect(() => {
        if (!questions.length) return;
        const currentSection = sections.find(s => s.indices.includes(currentQuestionIndex));
        if (currentSection && currentSection.name !== activeSection) {
            setActiveSection(currentSection.name);
        }
        // Mark as visited
        const currentQId = questions[currentQuestionIndex]?.id;
        if (currentQId && !visited.includes(currentQId)) {
            setVisited(prev => [...prev, currentQId]);
        }
    }, [currentQuestionIndex, questions, sections]);

    const [questionTimeLog, setQuestionTimeLog] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                if (params.id?.toString().startsWith('adaptive')) {
                    // Fetch dynamic AI recommended questions for adaptive session
                    const response = await api.post('/ai/start-adaptive-session');
                    const { questions: adaptiveQuestions } = response.data;

                    if (!adaptiveQuestions || adaptiveQuestions.length === 0) {
                        setIsLoading(false);
                        return;
                    }

                    setQuestions(adaptiveQuestions);
                    // Session is already started by the start-adaptive-session endpoint in backend
                } else {
                    // Standard exam model loading
                    let loadedQuestions: Question[] = [];

                    // Try fetching as Model first
                    try {
                        const response = await api.get(`/exams/models/${params.id}`);
                        const model = response.data;
                        if (model && model.questions && model.questions.length > 0) {
                            loadedQuestions = model.questions;
                        }
                    } catch (err) {
                        console.warn('Failed to fetch as model, trying as exam...', err);
                    }

                    // If not found, try fetching as Exam
                    if (loadedQuestions.length === 0) {
                        try {
                            const response = await api.get(`/exams/${params.id}`);
                            const exam = response.data;
                            if (exam && exam.questions && exam.questions.length > 0) {
                                loadedQuestions = exam.questions;
                            }
                        } catch (err) {
                            console.error('Failed to fetch as exam', err);
                        }
                    }

                    if (loadedQuestions.length === 0) {
                        setIsLoading(false);
                        return;
                    }

                    setQuestions(loadedQuestions);

                    // Start Test Session
                    try {
                        const sessionRes = await api.post('/test-session/start', { testId: params.id });
                        const session = sessionRes.data;
                        if (session) {
                            console.log('Session loaded/started:', session);
                            if (session.answers) setAnswers(session.answers);
                            if (session.timings) setQuestionTimeLog(session.timings);
                            if (session.flags) setFlags(session.flags);
                            // Set current index to last answered or first
                            const lastAnsweringIdx = loadedQuestions.findIndex(q => !session.answers[q.id]);
                            if (lastAnsweringIdx !== -1) setCurrentQuestionIndex(lastAnsweringIdx);
                        }
                    } catch (e) {
                        console.error('Failed to start/load session:', e);
                    }
                }
            } catch (err) {
                console.error('Failed to load test:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [params.id]);

    useEffect(() => {
        if (!questions.length || isSubmitting) return;
        const timer = setInterval(() => {
            const currentQId = questions[currentQuestionIndex]?.id;
            if (currentQId) {
                setQuestionTimeLog(prev => ({
                    ...prev,
                    [currentQId]: (prev[currentQId] || 0) + 1
                }));
            }
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [questions, currentQuestionIndex, isSubmitting]);

    const handleOptionSelect = (optionId: string) => {
        const questionId = questions[currentQuestionIndex].id;
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleClearResponse = () => {
        const questionId = questions[currentQuestionIndex].id;
        const newAnswers = { ...answers };
        delete newAnswers[questionId];
        setAnswers(newAnswers);
        syncProgress(newAnswers, questionTimeLog);
    };

    const syncProgress = async (currentAnswers: any, currentTimings: any) => {
        try {
            await api.post(`/test-session/${params.id}/sync`, {
                answers: currentAnswers,
                timings: currentTimings
            });
        } catch (error) {
            console.error('Failed to sync progress:', error);
        }
    };

    // Periodic Auto-Sync (Every 30s)
    useEffect(() => {
        if (!questions.length || isSubmitting) return;
        const syncInterval = setInterval(() => {
            syncProgress(answers, questionTimeLog);
        }, 30000); // 30 seconds
        return () => clearInterval(syncInterval);
    }, [answers, questionTimeLog, questions, isSubmitting]);

    const handleSaveAndNext = () => {
        // Incrementally sync before moving
        syncProgress(answers, questionTimeLog);

        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            syncProgress(answers, questionTimeLog);
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleMarkForReview = async () => {
        const questionId = questions[currentQuestionIndex].id;
        if (!flags.includes(questionId)) {
            const newFlags = [...flags, questionId];
            setFlags(newFlags);
            // Toggle flag on backend
            try { await api.post(`/test-session/${params.id}/flag`, { questionId }); } catch (e) { }
        }
        handleSaveAndNext();
    };

    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const handleSubmit = () => {
        setShowSubmitModal(true);
    };

    const submitTest = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const payload = {
                timings: questionTimeLog,
                answers // Send final answers
            };

            const response = await api.post(`/test-session/${params.id}/submit`, payload);
            const { attemptId } = response.data;
            router.push(`/dashboard/results/${attemptId}`);
        } catch (error: any) {
            console.error("Failed to submit test:", error);
            const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
            alert(`Failed to submit test: ${errorMessage}`);
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (idx: number, id: string) => {
        const isAnswered = !!answers[id];
        const isFlagged = flags.includes(id);
        const isVisited = visited.includes(id);
        const isCurrent = currentQuestionIndex === idx;

        if (isCurrent) return 'bg-gray-200 border-gray-400'; // Current is handled by outline usually, but distinct status?
        if (isFlagged && isAnswered) return 'bg-[#7c3aed] text-white'; // Purple (Marked & Answered)
        if (isFlagged) return 'bg-[#a855f7] text-white'; // Purple (Marked)
        if (isAnswered) return 'bg-[#22c55e] text-white'; // Green
        if (isVisited && !isAnswered) return 'bg-[#ef4444] text-white'; // Red (Not Answered)
        return 'bg-white border-gray-300'; // Not Visited
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const [isFullScreen, setIsFullScreen] = useState(false);
    const enterFullScreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading Assessment...</div>;
    if (questions.length === 0) return <div>No Questions Found</div>;

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans">
            {/* 1. Header */}
            <header className="h-16 bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="font-bold text-lg text-slate-800 truncate max-w-md">SSC CGL 2030 Tier-I Mock Test</div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                        <div className="text-xs font-bold text-slate-500 uppercase">Time Left</div>
                        <div className="font-mono font-bold text-xl text-slate-800">{formatTime(timeLeft)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-8 h-8 rounded-full bg-slate-200 p-1.5 text-slate-500" />
                    </div>
                </div>
            </header>

            {/* 2. Section Tabs */}
            <div className="h-12 bg-white border-b flex items-center px-2 shadow-sm shrink-0 overflow-x-auto no-scrollbar">
                {sections.map(section => (
                    <button
                        key={section.name}
                        onClick={() => {
                            setActiveSection(section.name);
                            setCurrentQuestionIndex(section.firstIndex);
                        }}
                        className={`px-6 h-full text-sm font-bold border-b-2 transition-colors whitespace-nowrap
                            ${activeSection === section.name
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        {section.name} ({section.indices.length})
                    </button>
                ))}
            </div>

            {/* 3. Main Split Sections */}
            <div className="flex-1 flex overflow-hidden">
                {/* 3a. Question Area (Left) */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">

                    {/* Top Info Bar */}
                    <div className="h-12 border-b flex items-center justify-between px-6 bg-slate-50 text-sm">
                        <div className="font-bold text-blue-700">Question No. {currentQuestionIndex + 1}</div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="text-slate-500">Marks: <span className="text-green-600">+2.0</span> / <span className="text-red-500">-0.5</span></span>
                            <div className="flex items-center gap-1 text-slate-500 border-l pl-4 border-slate-300">
                                <AlertCircle className="w-3 h-3" /> Report
                            </div>
                        </div>
                    </div>

                    {/* Question Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
                        {/* Question Text */}
                        <div className="mb-8 text-lg font-medium text-slate-900 border-b pb-8 border-gray-100">
                            <MathRenderer content={currentQuestion.content} />
                        </div>

                        {/* Options */}
                        <div className="space-y-4 max-w-3xl">
                            {currentQuestion.options.map((option, idx) => {
                                const isSelected = answers[currentQuestion.id] === option.id;
                                return (
                                    <label
                                        key={option.id}
                                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                            ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:bg-slate-50 hover:border-slate-300'}`}
                                    >
                                        <div className="pt-0.5 relative">
                                            <input
                                                type="radio"
                                                name="question-option"
                                                checked={isSelected}
                                                onChange={() => handleOptionSelect(option.id)}
                                                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="text-base text-slate-800 font-medium pt-0.5">
                                            <MathRenderer content={option.text} />
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="h-16 border-t bg-white flex items-center justify-between px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 shrink-0">
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                className={`px-4 py-2 rounded-lg border font-bold transition-colors text-sm flex items-center gap-2
                                    ${currentQuestionIndex === 0
                                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-white border-gray-300 text-slate-600 hover:bg-gray-100'}`}
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            <button
                                onClick={handleClearResponse}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-slate-600 font-bold hover:bg-gray-100 transition-colors text-sm"
                            >
                                Clear Response
                            </button>
                            <button
                                onClick={handleMarkForReview}
                                className="px-4 py-2 rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold transition-colors text-sm flex items-center gap-2"
                            >
                                <Flag className="w-4 h-4 fill-purple-700" /> Mark for Review & Next
                            </button>
                        </div>

                        <button
                            onClick={handleSaveAndNext}
                            className="px-8 py-2.5 rounded-lg bg-[#2563eb] text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 text-sm flex items-center gap-2"
                        >
                            Save & Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 3b. Right Sidebar (Palette) */}
                <div className="w-[320px] bg-slate-50 border-l flex flex-col shrink-0">
                    {/* User & Info */}
                    <div className="p-4 bg-white border-b flex items-center gap-4">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-12 h-12 rounded-full border bg-slate-100" />
                        <div>
                            <div className="font-bold text-sm">Demo User</div>
                            <div className="text-xs text-slate-500">Student</div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="p-4 grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-slate-600 bg-white border-b">
                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#22c55e] text-white flex items-center justify-center">{Object.keys(answers).length}</div> Answered</div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#ef4444] text-white flex items-center justify-center">{visited.length - Object.keys(answers).length}</div> Not Answered</div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-500 flex items-center justify-center">{questions.length - visited.length}</div> Not Visited</div>
                        <div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-[#7c3aed] text-white flex items-center justify-center">{flags.length}</div> Marked</div>
                    </div>

                    {/* Palette Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="font-bold text-slate-500 text-xs uppercase mb-4 tracking-wider flex justify-between">
                            {activeSection}
                            <span className="bg-blue-100 text-blue-700 px-2 rounded-full text-[10px] py-0.5 flex items-center">SECTION</span>
                        </h3>

                        <div className="grid grid-cols-5 gap-2">
                            {sections.find(s => s.name === activeSection)?.indices.map(questionIndex => {
                                const questionId = questions[questionIndex].id;
                                const style = getStatusColor(questionIndex, questionId);
                                const isCurrent = currentQuestionIndex === questionIndex;

                                return (
                                    <button
                                        key={questionId}
                                        onClick={() => setCurrentQuestionIndex(questionIndex)}
                                        className={`w-10 h-9 rounded text-sm font-bold transition-all relative
                                            ${style}
                                            ${isCurrent ? 'ring-2 ring-blue-600 ring-offset-1 z-10' : 'hover:opacity-80'}
                                        `}
                                    >
                                        {questionIndex + 1}
                                        {flags.includes(questionId) && (
                                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#7c3aed] rounded-full border border-white" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Footer */}
                    <div className="p-4 border-t bg-white">
                        <button
                            onClick={handleSubmit}
                            className="w-full py-3 bg-[#00bfa5] hover:bg-[#00a891] text-white font-bold rounded-lg shadow-lg shadow-teal-500/20 transition-all text-sm uppercase tracking-wide"
                        >
                            Submit Test
                        </button>
                    </div>
                </div>
            </div>
            {/* Submit Confirmation Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200"
                        >
                            <div className="p-8">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Submit your test</h3>
                                <div className="mt-6 mb-8 overflow-hidden rounded-xl border border-gray-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#00bfa5] text-white text-[11px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 font-bold border-r border-teal-400/30">Section</th>
                                                <th className="px-4 py-3 font-bold border-r border-teal-400/30 text-center">No. of questions</th>
                                                <th className="px-4 py-3 font-bold border-r border-teal-400/30 text-center">Answered</th>
                                                <th className="px-4 py-3 font-bold border-r border-teal-400/30 text-center">Not Answered</th>
                                                <th className="px-4 py-3 font-bold border-r border-teal-400/30 text-center">Marked for Review</th>
                                                <th className="px-4 py-3 font-bold text-center">Not Visited</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 italic">
                                            {sections.map(section => {
                                                const indices = section.indices;
                                                const total = indices.length;
                                                const answered = indices.filter(idx => !!answers[questions[idx].id]).length;
                                                const flagged = indices.filter(idx => flags.includes(questions[idx].id)).length;
                                                const visitedCount = indices.filter(idx => visited.includes(questions[idx].id)).length;
                                                const notAnswered = visitedCount - answered;
                                                const notVisited = total - visitedCount;

                                                return (
                                                    <tr key={section.name} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-4 font-medium text-slate-700 border-r border-gray-100">{section.name}</td>
                                                        <td className="px-4 py-4 text-center border-r border-gray-100">{total}</td>
                                                        <td className="px-4 py-4 text-center border-r border-gray-100">{answered}</td>
                                                        <td className="px-4 py-4 text-center border-r border-gray-100 text-red-500 font-bold">{notAnswered}</td>
                                                        <td className="px-4 py-4 text-center border-r border-gray-100 text-purple-600 font-bold">{flagged}</td>
                                                        <td className="px-4 py-4 text-center">{notVisited}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-bold">
                                            <tr className="border-t border-gray-200">
                                                <td className="px-4 py-3 text-slate-900 border-r border-gray-200">Overall Summary</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">{questions.length}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">{Object.keys(answers).length}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">{visited.length - Object.keys(answers).length}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">{flags.length}</td>
                                                <td className="px-4 py-3 text-center">{questions.length - visited.length}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => setShowSubmitModal(false)}
                                        disabled={isSubmitting}
                                        className="px-8 py-2.5 rounded-lg bg-[#00bfa5] text-white font-bold hover:bg-[#00a891] transition-all shadow-md shadow-teal-500/10 text-sm whitespace-nowrap disabled:opacity-50"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={submitTest}
                                        disabled={isSubmitting}
                                        className="px-8 py-2.5 rounded-lg bg-[#00bfa5] text-white font-bold hover:bg-[#00a891] transition-all shadow-md shadow-teal-500/10 text-sm whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Submitting...
                                            </>
                                        ) : "Submit"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Info, Flag, Shield, Menu, X, User, Pause, Play } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import MathRenderer from '@/components/MathRenderer';

interface Question {
    id: string;
    content: string;
    options: { id: string; text: string }[];
    topic?: string;
    positiveMarks?: number;
    negativeMarks?: number;
}

export default function TestPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flags, setFlags] = useState<string[]>([]);
    const [visited, setVisited] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseReason, setPauseReason] = useState<'manual' | 'security'>('manual');
    const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes default
    const [modelTitle, setModelTitle] = useState('Assessment in Progress');



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
                    // Fetch existing session info (including questions) for adaptive session
                    try {
                        const sessionRes = await api.get(`/test-session/${params.id}`);
                        const session = sessionRes.data;

                        if (session && session.questions && session.questions.length > 0) {
                            setQuestions(session.questions);
                            setModelTitle('Adaptive AI Practice');

                            // Load session state
                            if (session.answers) setAnswers(session.answers);
                            if (session.timings) setQuestionTimeLog(session.timings);
                            if (session.flags) setFlags(session.flags);

                            // Restore visited state
                            const visitedSet = new Set<string>();
                            if (session.answers) Object.keys(session.answers).forEach(k => visitedSet.add(k));
                            if (session.timings) Object.keys(session.timings).forEach(k => visitedSet.add(k));
                            setVisited(Array.from(visitedSet));

                            // Timer Sync
                            if (session.startTime) {
                                const now = Date.now();
                                const elapsedSeconds = Math.floor((now - session.startTime) / 1000);
                                const durationSeconds = 60 * 60; // 60 mins default for adaptive
                                const remaining = Math.max(0, durationSeconds - elapsedSeconds);
                                setTimeLeft(remaining);
                            }
                        } else {
                            console.error("Adaptive session found but no questions available");
                        }
                    } catch (err) {
                        console.error("Failed to load adaptive session", err);
                    }
                    setIsLoading(false);
                    return;
                } else if (params.id?.toString().startsWith('chapter-')) {
                    // --- Chapter Wise Practice Mode ---
                    const chapterId = params.id.toString().replace('chapter-', '');
                    try {
                        // 1. Fetch Questions for Chapter
                        const response = await api.get(`/exams/chapters/${chapterId}/questions`);
                        const loadedQuestions = response.data;

                        if (loadedQuestions && loadedQuestions.length > 0) {
                            setQuestions(loadedQuestions);
                            setModelTitle('Chapter Practice');

                            // 2. Load Session (Already started by PracticePage)
                            const sessionRes = await api.get(`/test-session/${params.id}`);
                            const session = sessionRes.data;

                            if (session) {
                                if (session.answers) setAnswers(session.answers);
                                if (session.timings) setQuestionTimeLog(session.timings);
                                if (session.flags) setFlags(session.flags);

                                // Restore visited state
                                const visitedSet = new Set<string>();
                                if (session.answers) Object.keys(session.answers).forEach(k => visitedSet.add(k));
                                if (session.timings) Object.keys(session.timings).forEach(k => visitedSet.add(k));
                                setVisited(Array.from(visitedSet));

                                // Set Timer (Practice Mode usually untimed, but let's keep it consistent or huge)
                                // Let's give 2 hours for practice
                                if (session.startTime) {
                                    const now = Date.now();
                                    const elapsedSeconds = Math.floor((now - session.startTime) / 1000);
                                    const durationSeconds = 2 * 60 * 60; // 2 hours
                                    const remaining = Math.max(0, durationSeconds - elapsedSeconds);
                                    setTimeLeft(remaining);
                                }
                            }
                        } else {
                            console.warn('No questions found for this chapter');
                        }
                    } catch (err) {
                        console.error('Failed to load chapter practice', err);
                    }
                    setIsLoading(false);
                    return;
                } else {
                    // Standard exam model loading
                    let loadedQuestions: Question[] = [];
                    let testDurationMinutes = 60; // Default

                    // Try fetching as Model first
                    try {
                        const response = await api.get(`/exams/models/${params.id}`);
                        const model = response.data;
                        if (model) {
                            setModelTitle(model.title);
                            if (model.questions && model.questions.length > 0) {
                                loadedQuestions = model.questions;
                            }
                            // Use Model duration, or fallback to Exam default if linked
                            // If model.duration > 0 use it. 
                            // If not, check if model has exams and use first exam's duration?
                            // For now, assume Model duration is authoritative if set, else 60.
                            if (model.duration && model.duration > 0) {
                                testDurationMinutes = model.duration;
                            } else if (model.exams && model.exams[0]?.duration) {
                                testDurationMinutes = model.exams[0].duration;
                            }
                        }
                    } catch (err) {
                        console.warn('Failed to fetch as model, trying as exam...', err);
                    }

                    // If not found, try fetching as Exam
                    if (loadedQuestions.length === 0) {
                        try {
                            const response = await api.get(`/exams/${params.id}`);
                            const exam = response.data;
                            if (exam) {
                                if (exam.questions && exam.questions.length > 0) {
                                    loadedQuestions = exam.questions;
                                }
                                if (exam.duration && exam.duration > 0) {
                                    testDurationMinutes = exam.duration;
                                }
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
                    // Duration Sync
                    const durationSeconds = testDurationMinutes * 60;

                    // Start Test Session
                    try {
                        const sessionRes = await api.post('/test-session/start', { testId: params.id });
                        const session = sessionRes.data;
                        if (session) {
                            console.log('Session loaded/started:', session);
                            if (session.answers) setAnswers(session.answers);
                            if (session.timings) setQuestionTimeLog(session.timings);
                            if (session.flags) setFlags(session.flags);

                            // Restore visited state from existing interactions
                            const visitedSet = new Set<string>();
                            if (session.answers) Object.keys(session.answers).forEach(k => visitedSet.add(k));
                            if (session.timings) Object.keys(session.timings).forEach(k => visitedSet.add(k));
                            setVisited(Array.from(visitedSet));

                            // Set current index to last answered or first
                            const lastAnsweringIdx = loadedQuestions.findIndex(q => !session.answers[q.id]);
                            if (lastAnsweringIdx !== -1) setCurrentQuestionIndex(lastAnsweringIdx);

                            // === TIMER SYNC ===
                            if (session.startTime) {
                                const now = Date.now();
                                const accumulated = session.accumulatedTime || 0;
                                let elapsedSeconds = accumulated;

                                if (session.status === 'PAUSED') {
                                    setIsPaused(true);
                                } else {
                                    elapsedSeconds += Math.floor((now - session.startTime) / 1000);
                                }

                                const remaining = Math.max(0, durationSeconds - elapsedSeconds);
                                setTimeLeft(remaining);
                            }
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
        if (!questions.length || isSubmitting || isPaused) return;
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
    }, [questions, currentQuestionIndex, isSubmitting, isPaused]);

    const handlePause = async (reason: 'manual' | 'security' = 'manual') => {
        if (isPaused || isSubmitting) return;
        try {
            setPauseReason(reason);
            setIsPaused(true); // Set local state immediately for responsiveness

            // Force progress sync before pausing
            await syncProgress(answers, questionTimeLog);
            await api.post(`/test-session/${params.id}/pause`);

            if (document.fullscreenElement) {
                try {
                    await document.exitFullscreen();
                } catch (e) {
                    // Silently fail if already exiting
                }
            }
        } catch (error) {
            console.error('Failed to pause session:', error);
            // Optionally revert isPaused if API fails? 
            // But usually we want to stop the timer anyway for user.
        }
    };


    const handleResume = async () => {
        if (!isPaused || isSubmitting) return;
        try {
            await api.post(`/test-session/${params.id}/resume`);

            // Re-enter fullscreen for integrity
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (e) {
                console.warn("Fullscreen resume failed:", e);
                // Even if fullscreen fails, we might want to let them continue 
                // but the security logic will just pause them again if they aren't in it.
                // However, the user request says it should work.
            }

            setIsPaused(false);
            setIsStarted(true);
        } catch (error) {
            console.error('Failed to resume session:', error);
        }
    };


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
        } else {
            // [NEW] Trigger submit summary prompt on the last question
            handleSubmit();
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

            // Exit fullscreen if active
            if (document.fullscreenElement) {
                try {
                    await document.exitFullscreen();
                } catch (err) {
                    console.error("Failed to exit fullscreen:", err);
                }
            }

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

        if (isFlagged && isAnswered) return 'bg-[#7c3aed] text-white'; // Purple (Marked & Answered)
        if (isFlagged) return 'bg-[#a855f7] text-white'; // Purple (Marked)
        if (isAnswered) return 'bg-[#22c55e] text-white'; // Green
        if (isCurrent) return 'bg-gray-200 border-gray-400'; // Current (if not answered/marked)
        if (isVisited && !isAnswered) return 'bg-[#ef4444] text-white'; // Red (Not Answered)
        return 'bg-white border-gray-300'; // Not Visited
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const [isStarted, setIsStarted] = useState(false);

    // Auto-submit when time runs out

    useEffect(() => {
        if (timeLeft <= 0 && isStarted && !isSubmitting && questions.length > 0) {
            submitTest();
        }
    }, [timeLeft, isStarted, isSubmitting, questions.length]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isStarted && !isSubmitting && !isPaused) {
                handlePause('security');
            }
        };


        const preventDefault = (e: Event) => e.preventDefault();

        if (isStarted) {
            document.addEventListener('contextmenu', preventDefault);
            document.addEventListener('copy', preventDefault);
            document.addEventListener('cut', preventDefault);
            document.addEventListener('paste', preventDefault);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                    e.preventDefault();
                }
            });
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
        };
    }, [isStarted, isSubmitting, isPaused]);

    // Auto-start test on mount
    useEffect(() => {
        if (!isLoading && questions.length > 0 && !isStarted) {
            const startTest = async () => {
                try {
                    await document.documentElement.requestFullscreen();
                } catch (err) {
                    console.error("Fullscreen denied:", err);
                }
                setIsStarted(true);
            };
            startTest();
        }
    }, [isLoading, questions.length, isStarted]);

    const reEnterFullscreen = async () => {
        handleResume();
    };


    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading Assessment...</div>;
    if (questions.length === 0) return <div>No Questions Found</div>;



    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden font-sans select-none">
            {/* 1. Header */}
            <header className="h-16 bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="font-bold text-lg text-slate-800 truncate max-w-md">{modelTitle}</div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => handlePause('manual')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all"
                    >
                        <Pause className="w-3 h-3" /> PAUSE
                    </button>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                        <div className="text-xs font-bold text-slate-500 uppercase">Time Left</div>
                        <div className="font-mono font-bold text-xl text-slate-800">{formatTime(timeLeft)}</div>
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
                            <span className="text-slate-500">Marks:
                                <span className="text-green-600">+{currentQuestion.positiveMarks || 1.0}</span> /
                                <span className="text-red-500">-{currentQuestion.negativeMarks || 0.25}</span>
                            </span>
                        </div>
                    </div>

                    {/* Question Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto w-full">
                        <div className="max-w-[95%] mx-auto py-8">
                            {/* Question Text */}
                            <div className="mb-8 text-xl leading-8 font-medium text-slate-800 border-b pb-8 border-gray-100">
                                <MathRenderer content={currentQuestion.content} />
                            </div>

                            {/* Options */}
                            <div className="space-y-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = answers[currentQuestion.id] === option.id;
                                    const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D...

                                    return (
                                        <label
                                            key={option.id}
                                            className={`flex items-center gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all group relative overflow-hidden
                                                ${isSelected
                                                    ? 'border-[#00bfa5] bg-teal-50 shadow-md shadow-teal-500/10'
                                                    : 'border-slate-200 hover:border-slate-400 hover:bg-white bg-slate-50/50'}`}
                                        >
                                            {/* Selection Indicator */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 shrink-0 transition-colors
                                                ${isSelected
                                                    ? 'bg-[#00bfa5] border-[#00bfa5] text-white'
                                                    : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-500 group-hover:text-slate-600'}`}>
                                                {optionLabel}
                                            </div>

                                            <div className="text-lg text-slate-700 font-medium pt-0.5">
                                                <MathRenderer content={option.text} />
                                            </div>

                                            {/* Hidden Radio for accessibility */}
                                            <input
                                                type="radio"
                                                name="question-option"
                                                checked={isSelected}
                                                onChange={() => handleOptionSelect(option.id)}
                                                className="absolute opacity-0 w-0 h-0"
                                            />

                                            {isSelected && (
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#00bfa5]/20 to-transparent rounded-bl-3xl -mr-4 -mt-4" />
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
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
                            {currentQuestionIndex === questions.length - 1 ? 'Save & Submit' : 'Save & Next'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 3b. Right Sidebar (Palette) */}
                <div className="w-[340px] bg-slate-50 border-l border-slate-200 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] flex flex-col shrink-0 z-30">
                    {/* User & Info */}
                    <div className="p-4 bg-white border-b flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500 overflow-hidden">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-slate-900 truncate max-w-[150px]" title={user?.fullName || 'User'}>
                                {user?.fullName || 'User'}
                            </div>
                            <div className="text-xs text-slate-500 capitalize">{user?.role || 'Student'}</div>
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

            {/* PAUSED / SECURITY OVERLAY */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <div className="bg-white p-10 md:p-12 rounded-[3rem] shadow-2xl max-w-lg w-full text-center space-y-8 border border-white/20">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border shadow-inner ${pauseReason === 'security' ? 'bg-sky-50 border-sky-100' : 'bg-amber-50 border-amber-100'
                                }`}>
                                {pauseReason === 'security' ? (
                                    <Shield className="w-10 h-10 text-sky-500" />
                                ) : (
                                    <Pause className="w-10 h-10 text-amber-500" />
                                )}
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {pauseReason === 'security' ? 'Security Protocol' : 'Assessment Paused'}
                                </h2>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    {pauseReason === 'security' ? (
                                        "Integrity check triggered. To maintain a fair environment, this session has been suspended. Please re-enter secure mode to continue."
                                    ) : (
                                        "Your progress has been synchronized and the timer is suspended. Ready to continue when you are."
                                    )}
                                </p>
                            </div>

                            <button
                                onClick={handleResume}
                                className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Resume Assessment
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

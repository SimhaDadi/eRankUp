'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Clock, HelpCircle, CheckCircle, Info, Calculator, Eye, SkipForward, Award } from 'lucide-react';
import api from '@/lib/api';

interface Model {
    id: string;
    title: string;
    totalQuestions: number;
    duration: number;
    totalMarks: number;
    positiveMarks: number;
    negativeMarks: number;
    difficulty: string;
    allowCalculator: boolean;
    allowReview: boolean;
    allowSkip: boolean;
    customInstructions?: string;
}

export default function ExamStartPage() {
    const params = useParams();
    const router = useRouter();
    const [model, setModel] = useState<Model | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [agreedToInstructions, setAgreedToInstructions] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchModel = async () => {
            try {
                if (params.examId?.toString().startsWith('adaptive-')) {
                    // Adaptive sessions show a simplified instruction view
                    setModel({
                        id: params.examId as string,
                        title: 'Adaptive AI Practice',
                        totalQuestions: 20, // Default for adaptive
                        duration: 30,
                        totalMarks: 20,
                        positiveMarks: 1,
                        negativeMarks: 0,
                        difficulty: 'Adaptive',
                        allowCalculator: true,
                        allowReview: true,
                        allowSkip: true
                    });
                } else if (params.examId?.toString() === 'smart-revision') {
                    // Smart Revision Mode
                    const res = await api.get('/ai-study/revision');
                    const revisionData = res.data;
                    
                    if (!revisionData.available) {
                        throw new Error(revisionData.message || "No questions available for revision yet.");
                    }

                    setModel({
                        id: 'smart-revision',
                        title: 'Smart AI Revision',
                        totalQuestions: revisionData.questions?.length || 0,
                        duration: (revisionData.questions?.length || 10) * 1.5, // 1.5 mins per question
                        totalMarks: revisionData.questions?.length || 0,
                        positiveMarks: 1,
                        negativeMarks: 0.25,
                        difficulty: 'Personalized',
                        allowCalculator: true,
                        allowReview: true,
                        allowSkip: true,
                        customInstructions: "This session is tailored based on your recent mistakes. Focus on understanding the concepts behind these questions."
                    });
                } else if (params.examId?.toString().startsWith('chapter-')) {
                    const chapterId = params.examId.toString().replace('chapter-', '');
                    const res = await api.get(`/exams/chapters/${chapterId}/questions`);
                    const questions = res.data;
                    setModel({
                        id: params.examId as string,
                        title: 'Chapter Practice',
                        totalQuestions: questions.length,
                        duration: questions.length * 2, // 2 mins per question
                        totalMarks: questions.length,
                        positiveMarks: 1,
                        negativeMarks: 0.25,
                        difficulty: 'Mixed',
                        allowCalculator: true,
                        allowReview: true,
                        allowSkip: true
                    });
                } else {
                    const response = await api.get(`/exams/models/${params.examId}`);
                    setModel(response.data);
                }
            } catch (err: any) {
                console.error('Failed to fetch model:', err);
                const msg = err.response?.data?.message || err.message || "Failed to load exam details";
                setError(msg);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.examId) {
            fetchModel();
        }
    }, [params.examId]);

    const handleStartExam = async () => {
        if (!agreedToInstructions) return;

        if (params.examId?.toString() === 'smart-revision') {
            try {
                // Pre-start the revision session so the test runner always finds it
                await api.post('/test-session/start/revision');
            } catch (err: any) {
                const msg = err.response?.data?.message || 'Failed to start revision session.';
                setError(msg);
                return;
            }
        }

        router.push(`/dashboard/test/${params.examId}`);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'hard':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
            default:
                return 'bg-orange-100 text-orange-700 border-orange-200';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Elevating Assessment Experience...</p>
                </div>
            </div>
        );
    }

    if (error || !model) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center px-4 max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Access Interrupted</h2>
                    <p className="text-slate-500 font-medium mb-6">{error || "The requested exam could not be located."}</p>
                    <button
                        onClick={() => router.push('/dashboard/exams')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10"
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Exam Title Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 shadow-xl text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <Award className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold">{model.title}</h1>
                                    <p className="text-blue-100 text-sm mt-1">Practice Test</p>
                                </div>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg border-2 font-bold text-sm uppercase ${getDifficultyColor(model.difficulty)} bg-white`}>
                            {model.difficulty}
                        </div>
                    </div>
                </div>

                {/* Metadata Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                <Info className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{model.totalQuestions}</div>
                            <div className="text-sm text-slate-500 font-medium mt-1">Questions</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{model.duration}</div>
                            <div className="text-sm text-slate-500 font-medium mt-1">Minutes</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                <Award className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{model.totalMarks}</div>
                            <div className="text-sm text-slate-500 font-medium mt-1">Marks</div>
                        </div>
                    </div>
                </div>

                {/* Secure Environment Card */}
                <div className="bg-white rounded-2xl p-8 shadow-md border border-slate-200">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Exam Environment</h2>
                        <p className="text-slate-600">
                            To maintain integrity, this exam must be taken in full-screen mode. Click below to enter the secure environment and begin.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-700">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Answers auto-saved</span>
                        </div>
                        {model.allowReview && (
                            <div className="flex items-center gap-3 text-slate-700">
                                <Eye className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm">Navigate freely between questions</span>
                            </div>
                        )}
                        {model.allowCalculator && (
                            <div className="flex items-center gap-3 text-slate-700">
                                <Calculator className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm">Calculator allowed</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions Section */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Info className="w-6 h-6 text-blue-600" />
                            <h3 className="text-lg font-bold text-slate-800">Instructions & Rules</h3>
                        </div>
                        <div className={`transform transition-transform ${showInstructions ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>

                    {showInstructions && (
                        <div className="px-6 pb-6 space-y-3 border-t border-slate-100 pt-4">
                            {/* Custom Instructions */}
                            {model.customInstructions && (
                                <>
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <p className="text-amber-800 font-medium text-sm">{model.customInstructions}</p>
                                    </div>
                                    <div className="border-t border-slate-200 my-4"></div>
                                </>
                            )}

                            {/* Dynamic Marking Scheme */}
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-slate-700 text-sm">
                                    Each question carries <span className="font-bold text-green-600">+{model.positiveMarks}</span> marks for correct answer
                                </p>
                            </div>

                            {model.negativeMarks > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-slate-700 text-sm">
                                        Incorrect answers have <span className="font-bold text-red-600">-{model.negativeMarks}</span> negative marking
                                    </p>
                                </div>
                            )}

                            {model.allowReview && (
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-slate-700 text-sm">You can mark questions for review and revisit them</p>
                                </div>
                            )}

                            {model.allowSkip && (
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-slate-700 text-sm">You can skip questions and answer them later</p>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-slate-700 text-sm">Exam will auto-submit when time expires</p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-slate-700 text-sm">Do not refresh or close the browser during the exam</p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-slate-700 text-sm">Ensure stable internet connection throughout</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Agreement Checkbox */}
                <div className={`bg-white rounded-xl p-6 border-2 transition-colors ${agreedToInstructions ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'}`}>
                    <label className="flex items-start gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToInstructions}
                            onChange={(e) => setAgreedToInstructions(e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-slate-800 font-medium">
                            I have read and understood the instructions
                        </span>
                    </label>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStartExam}
                    disabled={!agreedToInstructions}
                    className={`w-full py-5 rounded-xl font-bold text-lg uppercase tracking-wide transition-all shadow-lg ${agreedToInstructions
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {agreedToInstructions ? 'START EXAM →' : 'PLEASE ACCEPT INSTRUCTIONS'}
                </button>

                {/* Help Link */}
                <div className="text-center">
                    <button className="text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-2 mx-auto transition-colors">
                        <HelpCircle className="w-4 h-4" />
                        Need help? Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}

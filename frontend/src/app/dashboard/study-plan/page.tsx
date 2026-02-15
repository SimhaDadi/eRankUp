'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    Target,
    BookOpen,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Clock,
    BarChart3
} from 'lucide-react';

interface Question {
    id: string;
    content: string;
    subject: string;
    chapter: string;
    difficulty: number;
}

interface LearningPath {
    userId: string;
    rationale: string;
    totalQuestions: number;
    questions: Question[];
}

export default function StudyPlanPage() {
    const { user } = useAuthStore();
    const [plan, setPlan] = useState<LearningPath | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const fetchPlan = async () => {
            if (!user?.id) return;
            try {
                const res = await api.get('/adaptive/learning-path');
                setPlan(res.data);
            } catch (error: any) {
                console.error("Failed to fetch study plan", error);
                setError(error.response?.data?.message || error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlan();
    }, [user?.id]);

    const handleStartPractice = async () => {
        try {
            setIsLoading(true);
            // [FIX] Send the exact questions shown in the UI to ensure consistency
            const questionIds = plan?.questions.map(q => q.id) || [];

            const res = await api.post('/adaptive/start-session', { questionIds });
            const { sessionId } = res.data;
            // Redirect to instructions instead of direct test
            router.push(`/dashboard/exam-start/${sessionId}`);
        } catch (error) {
            console.error("Failed to start adaptive practice", error);
            alert("Failed to initialize session. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
                >
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-[#00bfa5] rounded-full animate-spin"></div>
                        <Brain className="w-8 h-8 text-[#00bfa5] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-900">Preparing Your Personalized Practice Session</h2>
                        <p className="text-slate-500 mt-2">Optimizing question selection for your mastery level...</p>
                    </div>
                </motion.div>
            ) : !plan ? (
                <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <h2 className="text-xl font-bold text-slate-800">Unable to generate plan</h2>
                    <p className="text-slate-500">Please try attempting some tests first.</p>
                    {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-5xl mx-auto space-y-8 pb-20"
                >
                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-br from-[#00bfa5] to-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Personalized Learning Path</h1>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mt-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#00bfa5] mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> AI Rationale
                                </h3>
                                <p className="text-slate-700 text-lg leading-relaxed font-medium">
                                    {plan.rationale}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-8">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-slate-900">{plan.totalQuestions}</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Target Questions</div>
                                    </div>
                                </div>
                                <div className="bg-violet-50 border border-violet-100 p-4 rounded-xl flex items-center gap-4">
                                    <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-slate-900">~{Math.ceil(plan.totalQuestions * 1.5)}m</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Est. Time</div>
                                    </div>
                                </div>
                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-4">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-slate-900">Adaptive</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Difficulty</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-full blur-3xl opacity-50 -z-10" />
                    </motion.div>

                    {/* Questions List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
                            <BookOpen className="w-5 h-5 text-slate-400" /> Recommended Practice
                        </h2>

                        {plan.questions.map((question, index) => (
                            <motion.div
                                key={question.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-[#00bfa5]/30 hover:shadow-lg hover:shadow-[#00bfa5]/5 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 text-sm group-hover:bg-[#00bfa5] group-hover:text-white transition-colors">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                                {question.subject}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                                {question.chapter}
                                            </span>
                                            <div className="ml-auto flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1.5 h-1.5 rounded-full ${i < (question.difficulty * 5) ? 'bg-orange-400' : 'bg-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-slate-800 font-medium line-clamp-2 mb-3">
                                            {question.content}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex justify-center pt-8">
                        <button
                            onClick={handleStartPractice}
                            className="bg-[#00bfa5] hover:bg-[#008f7a] text-white px-10 py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-[#00bfa5]/20 hover:scale-105 active:scale-95 flex items-center gap-3">
                            Start Adaptive Practice Session <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

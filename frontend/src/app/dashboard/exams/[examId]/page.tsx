'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    ChevronRight,
    Clock,
    Star,
    ArrowLeft,
    Lock,
    Globe,
    Sparkles,
    Trophy,
    CheckCircle2,
    Layers,
    Zap,
    ShieldCheck,
    Info,
    Calendar,
    Target,
    Compass,
    Activity
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import Script from 'next/script';
import { useParams, useRouter } from 'next/navigation';

interface Exam {
    id: string;
    title: string;
    description: string;
    isPremium: boolean;
    price: number;
    hasPurchased?: boolean;
    chapters: Chapter[];
    questions?: any[];
}

interface Chapter {
    id: string;
    title: string;
    models: Model[];
}

interface Model {
    id: string;
    title: string;
    difficultyLevel: string;
    scheduledAt?: string;
}

export default function ExamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [exam, setExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [attempts, setAttempts] = useState<any[]>([]);

    useEffect(() => {
        if (params.examId) {
            fetchExam(params.examId as string);
            fetchAttempts(params.examId as string);
        }
    }, [params.examId]);

    const fetchAttempts = async (id: string) => {
        try {
            const response = await api.get(`/exams/${id}/my-attempts`);
            setAttempts(response.data);
        } catch (error) {
            console.error('Failed to fetch attempts', error);
        }
    };

    const fetchExam = async (id: string) => {
        try {
            const response = await api.get(`/exams/${id}`);
            setExam(response.data);
        } catch (error) {
            console.error('Failed to fetch exam', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!exam) return;
        try {
            const payload: any = { examId: exam.id };
            if (couponCode.trim()) {
                payload.couponCode = couponCode.trim();
            }

            const response = await api.post('/payments/create-order', payload);
            const data = response.data;

            if (data.discountApplied) {
                setAppliedDiscount(data.discountApplied);
            }

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "eRankUp",
                description: "Premium Exam Access",
                order_id: data.orderId,
                handler: function (response: any) {
                    alert("Payment Successful! Your access will be activated shortly.");
                    fetchExam(exam.id);
                },
                prefill: {
                    name: data.user.name,
                    email: data.user.email,
                },
                theme: {
                    color: "#0284c7", // Sky blue
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to initiate purchase. Please try again.";
            alert(errorMsg);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-[#fbfdff]">
                <div className="w-10 h-10 border-[2px] border-sky-100 border-t-sky-500 rounded-full animate-spin" />
                <p className="mt-4 text-sky-400 font-bold uppercase tracking-[0.2em] text-[9px]">Refreshing Flow...</p>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                <Compass className="w-10 h-10 text-sky-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Series Not Located</h2>
                <Link
                    href="/dashboard/exams"
                    className="mt-6 px-6 py-2.5 bg-sky-600 text-white font-black text-[9px] uppercase tracking-widest rounded-lg shadow-lg shadow-sky-600/10"
                >
                    Back to Hub
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfdff] pb-24 relative overflow-x-hidden selection:bg-sky-100 selection:text-sky-900">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-sky-100 rounded-full blur-[100px]" />
                <div className="absolute bottom-[0%] right-[-5%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 space-y-8">
                {/* Header - BREEZE */}
                <div className="flex items-center justify-between py-3 border-b border-sky-50">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-3 text-slate-400 hover:text-sky-600 transition-all font-black"
                    >
                        <div className="w-9 h-9 flex items-center justify-center bg-white rounded-xl border border-sky-50 shadow-sm group-hover:border-sky-200 transition-all">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.3em]">Return</span>
                    </button>

                    <div className="hidden md:flex items-center gap-8">
                        <DetailMetric label="STUDENTS" value="48k+" color="text-sky-600" />
                        <DetailMetric label="TRUST" value="4.9/5" color="text-emerald-500" />
                    </div>
                </div>

                {/* Hero / Info Card - BREEZE RADIANT */}
                <div className="relative group/hero">
                    <div className="bg-white border border-sky-50/50 rounded-3xl overflow-hidden shadow-sm relative transition-all group-hover/hero:border-sky-200/50 group-hover/hero:shadow-lg">
                        {/* Top Lining */}
                        <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-emerald-400 to-transparent opacity-60" />

                        <div className="p-8 lg:p-10 flex flex-col xl:flex-row justify-between items-start gap-10 relative overflow-hidden">
                            <div className="space-y-6 max-w-4xl relative z-10">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="px-3 py-1 bg-sky-50 text-sky-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-sky-100">
                                            High Fidelity
                                        </div>
                                        {exam.isPremium && (
                                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                                <Star className="w-3 h-3 fill-current" /> Premium
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-none">
                                        {exam.title}
                                    </h2>
                                </div>

                                <p className="text-slate-500 leading-snug text-base lg:text-lg font-medium tracking-tight line-clamp-2 max-w-2xl">
                                    {exam.description || 'Access high-fidelity test series architected for elite results.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-8 pt-2">
                                    {(() => {
                                        const totalUnits = exam.chapters?.reduce((acc, ch) => acc + (ch.models?.length || 0), 0) || 0;
                                        if (totalUnits > 0) {
                                            return <HeroBadge icon={Layers} label="TOTAL" value={`${totalUnits} Units`} color="text-sky-500" />;
                                        }
                                        return <HeroBadge icon={Layers} label="CONTENT" value="Full Length" color="text-sky-500" />;
                                    })()}
                                    <HeroBadge icon={Globe} label="LANG" value="English, Hindi" color="text-emerald-500" />
                                    <HeroBadge icon={Activity} label="STATUS" value="Active" color="text-sky-500" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 w-full xl:w-auto xl:min-w-[300px] relative z-10">
                                <div className="bg-slate-50 border border-sky-50 rounded-2xl p-8 space-y-6 relative overflow-hidden shadow-inner">
                                    {exam.isPremium && !exam.hasPurchased ? (
                                        <>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">INVESTMENT</div>
                                                <div className="flex items-end gap-2 text-slate-800">
                                                    <span className="text-3xl font-black tracking-tighter">₹{appliedDiscount > 0 ? exam.price - appliedDiscount : exam.price}</span>
                                                    {appliedDiscount > 0 && <span className="text-base text-slate-300 line-through font-bold mb-1">₹{exam.price}</span>}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <button
                                                    onClick={handlePurchase}
                                                    className="w-full bg-sky-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-sky-600/10 hover:bg-sky-700 active:scale-95 flex items-center justify-center gap-3"
                                                >
                                                    <Zap className="w-4 h-4 fill-current" />
                                                    <span className="uppercase tracking-[0.2em] text-[10px]">Unlock Now</span>
                                                </button>

                                                {!showCouponInput ? (
                                                    <button
                                                        onClick={() => setShowCouponInput(true)}
                                                        className="w-full text-[9px] text-slate-400 hover:text-sky-600 font-black uppercase tracking-[0.3em] transition-colors"
                                                    >
                                                        Apply Coupon
                                                    </button>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="PROMO KEY"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                        className="w-full bg-white border border-sky-100 rounded-xl px-4 py-3 text-[9px] font-black tracking-[0.2em] text-slate-700 outline-none focus:border-sky-300 transition-colors"
                                                    />
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-4 space-y-4">
                                            <div className="w-14 h-14 bg-white border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto shadow-sm">
                                                <ShieldCheck className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-700 tracking-tight leading-none">Access Granted</h3>

                                            <Link
                                                href={`/dashboard/exam-start/${exam.id}`}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px]"
                                            >
                                                Start Now
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chapters & Tests - BREEZE GRID */}
                <div className="space-y-8">
                    {exam.chapters && exam.chapters.length > 0 && (
                        <div className="flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-7 bg-emerald-500 rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-wider">
                                    Units & Modules
                                </h3>
                            </div>
                        </div>
                    )}

                    <div className="space-y-10">
                        {exam.chapters?.map((chapter, idx) => (
                            <motion.div
                                key={chapter.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="space-y-5"
                            >
                                <div className="flex items-center justify-between px-6">
                                    <h4 className="font-bold text-base text-slate-700 tracking-tight">{chapter.title}</h4>
                                    <div className="px-3 py-1 bg-sky-50 border border-sky-100/50 rounded-lg text-[9px] font-black text-sky-600 uppercase tracking-widest">
                                        {chapter.models?.length || 0} Units
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {chapter.models?.map((model, mIdx) => (
                                        <TestUnit key={model.id} model={model} isUnlocked={!exam.isPremium || !!exam.hasPurchased} index={mIdx} />
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {(!exam.chapters || exam.chapters.length === 0) && exam.questions && exam.questions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 bg-white border border-emerald-100/50 rounded-2xl shadow-lg shadow-emerald-500/5 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${attempts.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} border`}>
                                            {attempts.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{attempts.length > 0 ? 'Completed' : 'Practice Mode'}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{attempts.length > 0 ? 'View Your Analysis' : 'Ready to Start?'}</h3>
                                        <p className="text-slate-500 font-medium max-w-lg">
                                            {attempts.length > 0
                                                ? `You have attempted this exam ${attempts.length} times. View your performance analysis.`
                                                : `This exam contains ${exam.questions.length} questions ready for practice. Access is fully granted. Best of luck!`}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        {attempts.length > 0 && (
                                            <Link
                                                href={`/dashboard/results/${attempts[0].id}`}
                                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:-translate-y-1 flex items-center gap-3"
                                            >
                                                View Result
                                                <Trophy className="w-4 h-4" />
                                            </Link>
                                        )}
                                        <Link
                                            href={`/dashboard/exam-start/${exam.id}`}
                                            className={`px-8 py-4 ${attempts.length > 0 ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'} font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 flex items-center gap-3`}
                                        >
                                            {attempts.length > 0 ? 'Retake Exam' : 'Start Practice'}
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TestUnit({ model, isUnlocked, index }: { model: Model, isUnlocked: boolean, index: number }) {
    const isReady = (scheduledAt?: string) => {
        if (!scheduledAt) return true;
        return new Date() >= new Date(scheduledAt);
    };

    const ready = isReady(model.scheduledAt);
    const accentColor = index % 2 === 0 ? "bg-sky-600" : "bg-emerald-500";
    // const lightColor = index % 2 === 0 ? "bg-sky-50" : "bg-emerald-50";

    if (!isUnlocked) {
        return (
            <div className="group p-6 bg-white border border-slate-100 rounded-2xl relative overflow-hidden h-full flex flex-col shadow-sm">
                {/* Midnight Silk Lining */}
                <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-slate-900/10" />

                <div className="absolute inset-0 bg-slate-50 opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-sm rounded-2xl">
                    <Lock className="w-5 h-5 text-slate-400 mb-2" />
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Locked</span>
                </div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">{model.difficultyLevel}</span>
                </div>
                <h5 className="font-bold text-slate-300 text-lg leading-tight mb-auto">{model.title}</h5>
            </div>
        );
    }

    return (
        <div
            className={`group p-6 bg-white border border-slate-100 rounded-2xl relative overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-md hover:border-sky-100/50 ${!ready ? 'cursor-not-allowed opacity-60' : ''}`}
        >
            {/* Midnight Silk Lining - Architecture Detail */}
            <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-slate-900/5 group-hover:bg-sky-600/20 transition-colors" />

            {/* Breeze Top Lining */}
            <div className={`absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent ${index % 2 === 0 ? 'via-sky-400/20' : 'via-emerald-400/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex justify-between items-start mb-6">
                <span className={`text-[9px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border ${model.difficultyLevel === 'Hard' ? 'bg-red-50 text-red-600 border-red-100' :
                    model.difficultyLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                    {model.difficultyLevel}
                </span>
                {!ready && (
                    <div className="text-[8px] bg-sky-50 text-sky-600 px-2 py-1 rounded-lg font-black uppercase border border-sky-100">
                        Soon
                    </div>
                )}
            </div>

            <h5 className="font-black text-slate-700 text-lg leading-tight mb-auto group-hover:text-sky-600 transition-colors">
                {model.title}
            </h5>

            <div className="mt-8 pt-4 border-t border-sky-50 flex items-center justify-between">
                {ready ? (
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Included in Full Exam
                    </span>
                ) : (
                    <span className="text-[9px] text-sky-400 font-bold uppercase tracking-[0.1em]">{new Date(model.scheduledAt!).toLocaleDateString()}</span>
                )}
            </div>
        </div>
    );
}

function DetailMetric({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">{label}</span>
            <span className={`${color} font-black text-xl tracking-tighter leading-none`}>{value}</span>
        </div>
    );
}

function HeroBadge({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-sky-50 shadow-sm ${color}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className="text-sm font-black text-slate-700 tracking-tight leading-none">{value}</span>
            </div>
        </div>
    );
}

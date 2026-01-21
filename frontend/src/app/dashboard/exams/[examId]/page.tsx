'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Clock, Star, ArrowLeft, Lock } from 'lucide-react';
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

    useEffect(() => {
        if (params.examId) {
            fetchExam(params.examId as string);
        }
    }, [params.examId]);

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

    const [showCouponInput, setShowCouponInput] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);

    const handlePurchase = async () => {
        if (!exam) return;
        try {
            const payload: any = { examId: exam.id };
            if (couponCode.trim()) {
                payload.couponCode = couponCode.trim();
            }

            const response = await api.post('/payments/create-order', payload);
            const data = response.data;

            // Store discount if applied
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
                    fetchExam(exam.id); // Refresh to show purchased status
                },
                prefill: {
                    name: data.user.name,
                    email: data.user.email,
                },
                theme: {
                    color: "#00bfa5",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to initiate purchase. Please try again.";
            alert(errorMsg);
        }
    };

    const isLive = (scheduledAt?: string) => {
        if (!scheduledAt) return true;
        return new Date() >= new Date(scheduledAt);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!exam) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <p>Exam not found.</p>
                <Link href="/dashboard/exams" className="text-[#00bfa5] hover:underline mt-2">Back to Test Series</Link>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
                    <p className="text-slate-500 text-sm">Detailed Test Series View</p>
                </div>
            </div>

            {/* Hero / Info Card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{exam.title}</h2>
                            {exam.isPremium && (
                                <span className="bg-amber-100 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" /> Premium
                                </span>
                            )}
                        </div>
                        <p className="text-slate-600 leading-relaxed text-lg">{exam.description || 'Comprehensive test series designed to help you ace your exams with expert-curated questions and detailed analysis.'}</p>

                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <BookOpen className="w-4 h-4 text-[#00bfa5]" />
                                {exam.chapters?.reduce((acc, ch) => acc + (ch.models?.length || 0), 0) || 0} Tests
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Globe className="w-4 h-4 text-blue-500" />
                                English, Hindi
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                        {exam.isPremium && !exam.hasPurchased ? (
                            <>
                                {/* Coupon Input Section */}
                                {showCouponInput && (
                                    <div className="w-full flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Enter coupon code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00bfa5] focus:border-transparent"
                                        />
                                        <button
                                            onClick={() => setShowCouponInput(false)}
                                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* Discount Display */}
                                {appliedDiscount > 0 && (
                                    <div className="w-full bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm font-bold text-green-700">
                                        🎉 Discount Applied: ₹{appliedDiscount} off!
                                    </div>
                                )}

                                <button
                                    onClick={handlePurchase}
                                    className="w-full md:w-auto bg-[#00bfa5] hover:bg-[#008f7a] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 flex items-center justify-center gap-2 transform active:scale-95"
                                >
                                    <Lock className="w-4 h-4" />
                                    Unlock Full Series for ₹{appliedDiscount > 0 ? exam.price - appliedDiscount : exam.price}
                                </button>

                                {/* Have a coupon link */}
                                {!showCouponInput && (
                                    <button
                                        onClick={() => setShowCouponInput(true)}
                                        className="text-xs text-[#00bfa5] hover:underline font-medium"
                                    >
                                        Have a coupon code?
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="w-full md:w-auto bg-emerald-50 text-emerald-600 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider border border-emerald-100 flex items-center justify-center gap-2">
                                <Star className="w-4 h-4 fill-current" />
                                {exam.isPremium ? 'Premium Unlocked' : 'Free Access'}
                            </div>
                        )}
                        {exam.isPremium && !exam.hasPurchased && (
                            <p className="text-xs text-slate-400 font-medium">One-time payment • Lifetime access</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Chapters & Tests */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <BookOpen className="w-5 h-5 text-[#00bfa5]" />
                    Learning Material & Tests
                </h3>

                {exam.chapters?.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">No chapters available yet.</p>
                    </div>
                )}

                {exam.chapters?.map((chapter, idx) => (
                    <motion.div
                        key={chapter.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                    >
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h4 className="font-bold text-lg text-slate-900">{chapter.title}</h4>
                            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border border-gray-200">
                                {chapter.models?.length || 0} Items
                            </span>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {chapter.models?.map((model) => (
                                <div key={model.id}>
                                    {(!exam.isPremium || exam.hasPurchased) ? (
                                        <Link
                                            href={isLive(model.scheduledAt) ? `/dashboard/test/${model.id}` : '#'}
                                            className={`group flex flex-col p-5 rounded-xl border transition-all relative overflow-hidden h-full ${isLive(model.scheduledAt)
                                                ? 'border-gray-200 bg-white hover:border-[#00bfa5] hover:shadow-md hover:-translate-y-1 cursor-pointer'
                                                : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-70'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${model.difficultyLevel === 'Hard' ? 'bg-red-50 text-red-600' :
                                                    model.difficultyLevel === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    {model.difficultyLevel}
                                                </span>
                                                {model.scheduledAt && !isLive(model.scheduledAt) && (
                                                    <div className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded font-bold uppercase flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Scheduled
                                                    </div>
                                                )}
                                            </div>

                                            <h5 className="font-bold text-slate-800 text-lg leading-tight mb-auto group-hover:text-[#00bfa5] transition-colors">
                                                {model.title}
                                            </h5>

                                            {model.scheduledAt && !isLive(model.scheduledAt) ? (
                                                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 text-xs text-red-500 font-bold">
                                                    Live: {new Date(model.scheduledAt).toLocaleString()}
                                                </div>
                                            ) : (
                                                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between text-sm font-bold text-[#00bfa5] opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                                    <span>Start Test</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            )}
                                        </Link>
                                    ) : (
                                        <div className="p-5 rounded-xl border border-gray-100 bg-slate-50/50 relative group h-full flex flex-col">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-xl">
                                                <Lock className="w-6 h-6 text-amber-500 mb-2" />
                                                <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Premium Locked</span>
                                            </div>
                                            <h5 className="font-medium text-slate-400 mb-auto">{model.title}</h5>
                                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                <Lock className="w-3 h-3" /> Locked
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function Globe(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}

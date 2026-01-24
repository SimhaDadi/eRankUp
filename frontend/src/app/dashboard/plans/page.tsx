'use client';

import { useEffect, useState } from 'react';
import { Check, Shield, Zap, Sparkles, Crown } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Pass {
    id: string;
    title: string;
    description: string;
    price: string;
    durationDays: number;
    features: string[];
    isPopular: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Pass[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/passes');
                setPlans(res.data);
            } catch (err) {
                console.error('Failed to fetch plans', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSelectPlan = async (plan: Pass) => {
        try {
            // Create Order
            const res = await api.post('/passes/create-order', { passId: plan.id });
            const data = res.data;

            if (data.isFree) {
                alert('Success! Your Free Trial has been activated.');
                router.push('/dashboard');
                return;
            }

            // Razorpay Payment
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "eRankUp",
                description: `Purchase ${plan.title}`,
                order_id: data.id,
                handler: async function (response: any) {
                    try {
                        await api.post('/passes/verify-payment', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        alert('Payment Successful! Your Pass is now active.');
                        router.push('/dashboard');
                    } catch (err) {
                        alert('Payment Verification Failed');
                        console.error(err);
                    }
                },
                prefill: {
                    name: "User", // Can fetch from AuthStore
                    email: "user@example.com"
                },
                theme: {
                    color: "#00bfa5"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error('Failed to initiate purchase', err);
            alert('Failed to initiate purchase. Please try again.');
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading Plans...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-8 lg:p-16 font-sans">
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                        Unlock Your <span className="text-[#00bfa5]">Potential</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                        Choose the plan that fits your preparation style. From trial access to elite annual memberships, we have you covered.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-[2.5rem] p-10 border transition-all duration-300 hover:scale-[1.02] 
                                ${plan.isPopular
                                    ? 'border-[#00bfa5] shadow-2xl shadow-teal-500/10 z-10 scale-105'
                                    : 'border-slate-100 shadow-xl shadow-slate-200/50'}`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                                    <div className="bg-[#00bfa5] text-white text-[11px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg shadow-teal-500/30 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Most Popular
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 mb-8">
                                <h3 className="text-xl font-bold text-slate-900">{plan.title}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">
                                        {parseFloat(plan.price) === 0 ? 'Free' : `₹${plan.price}`}
                                    </span>
                                    {parseFloat(plan.price) > 0 && <span className="text-sm font-bold text-slate-400">/ {plan.durationDays} days</span>}
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium pt-2">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-5 mb-10">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 
                                            ${plan.isPopular ? 'bg-teal-50 text-[#00bfa5]' : 'bg-slate-100 text-slate-500'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95
                                    ${plan.isPopular
                                        ? 'bg-[#00bfa5] hover:bg-[#00a891] text-white shadow-lg shadow-teal-500/20'
                                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10'}`}
                            >
                                {parseFloat(plan.price) === 0 ? 'Start Free Trial' : 'Get Access Now'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto">
                    <TrustItem icon={Shield} title="Secure Payment" desc="256-bit SSL Encrypted" />
                    <TrustItem icon={Zap} title="Instant Activation" desc="Start practicing immediately" />
                    <TrustItem icon={Crown} title="Premium Support" desc="Priority email assistance" />
                </div>
            </div>
        </div>
    );
}

function TrustItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex flex-col items-center text-center gap-3 hover:transform hover:translate-y-[-2px] transition-transform duration-300">
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-md flex items-center justify-center text-slate-400">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                <p className="text-xs text-slate-400 font-medium mt-1">{desc}</p>
            </div>
        </div>
    );
}

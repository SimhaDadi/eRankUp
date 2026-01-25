'use client';

import { useState, useEffect } from 'react';
import { X, Check, Sparkles, Tag } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Pass {
    id: string;
    title: string;
    description: string;
    price: number;
    durationDays: number;
    features: string[];
    isPopular: boolean;
    passType: string;
}

interface PassSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function PassSelectionModal({ isOpen, onClose, onSuccess }: PassSelectionModalProps) {
    const [passes, setPasses] = useState<Pass[]>([]);
    const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingPasses, setLoadingPasses] = useState(true);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (isOpen) {
            fetchPasses();
        }
    }, [isOpen]);

    const fetchPasses = async () => {
        setLoadingPasses(true);
        try {
            const response = await api.get('/passes');
            setPasses(response.data);
        } catch (error) {
            console.error('Failed to fetch passes:', error);
            alert('Failed to load passes. Please try again.');
        } finally {
            setLoadingPasses(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedPass) return;

        setLoading(true);
        try {
            const response = await api.post('/passes/create-order', {
                passId: selectedPass.id,
                couponCode: couponCode || undefined
            });

            const { id: orderId, amount, currency, keyId } = response.data;

            const options = {
                key: keyId,
                amount,
                currency,
                name: 'eRankUp',
                description: `Purchase ${selectedPass.title}`,
                order_id: orderId,
                prefill: {
                    name: user?.fullName || user?.email || '',
                    email: user?.email || ''
                },
                handler: async (response: any) => {
                    try {
                        await api.post('/passes/verify-payment', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        alert('Pass purchased successfully! You now have access to all content.');
                        onSuccess?.();
                        onClose();
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    }
                },
                theme: {
                    color: '#2563eb'
                }
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error: any) {
            console.error('Failed to create order:', error);
            alert(error.response?.data?.message || 'Failed to initiate purchase. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-800">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Choose Your Pass</h2>
                        <p className="text-slate-400 mt-1">Get unlimited access to all exams and features</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loadingPasses ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <p className="text-slate-400 mt-4">Loading passes...</p>
                        </div>
                    ) : (
                        <>
                            {/* Pass Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {passes.map((pass) => (
                                    <div
                                        key={pass.id}
                                        onClick={() => setSelectedPass(pass)}
                                        className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${selectedPass?.id === pass.id
                                                ? 'border-blue-500 bg-blue-500/10 scale-105'
                                                : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                            } ${pass.isPopular ? 'ring-2 ring-purple-500' : ''}`}
                                    >
                                        {pass.isPopular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                                <Sparkles className="w-4 h-4" />
                                                Most Popular
                                            </div>
                                        )}

                                        <div className="text-center mb-4">
                                            <h3 className="text-xl font-bold text-white mb-2">{pass.title}</h3>
                                            <div className="text-4xl font-black text-blue-400">
                                                ₹{pass.price}
                                            </div>
                                            <div className="text-sm text-slate-400 mt-1">
                                                {pass.passType === 'LIFETIME'
                                                    ? 'One-time payment'
                                                    : `for ${pass.durationDays} days`}
                                            </div>
                                        </div>

                                        <p className="text-slate-400 text-sm mb-4 text-center">
                                            {pass.description}
                                        </p>

                                        <ul className="space-y-2 mb-4">
                                            {pass.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {selectedPass?.id === pass.id && (
                                            <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Purchase Section */}
                            {selectedPass && (
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                    <h3 className="text-xl font-bold text-white mb-4">Complete Your Purchase</h3>

                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            Coupon Code (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code"
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="bg-slate-900 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-400">Selected Pass:</span>
                                            <span className="text-white font-semibold">{selectedPass.title}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Total Amount:</span>
                                            <span className="text-2xl font-bold text-blue-400">₹{selectedPass.price}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePurchase}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                Processing...
                                            </span>
                                        ) : (
                                            `Purchase ${selectedPass.title}`
                                        )}
                                    </button>

                                    <p className="text-xs text-slate-500 text-center mt-3">
                                        Secure payment powered by Razorpay
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

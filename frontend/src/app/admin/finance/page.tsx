'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Banknote,
    TrendingUp,
    CreditCard,
    RefreshCcw,
    CheckCircle,
    Clock,
    XCircle,
    Search,
    Download
} from 'lucide-react';
import api from '@/lib/api';

interface Payment {
    id: string;
    user: { name: string; email: string };
    exam: string;
    amount: number;
    status: string;
    orderId: string;
    paymentId?: string;
    date: string;
}

export default function FinancePage() {
    const [overview, setOverview] = useState<any>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [processingRefund, setProcessingRefund] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewRes, paymentsRes] = await Promise.all([
                api.get('/admin/finance/overview'),
                api.get('/admin/finance/payments', {
                    params: { page, limit: 20, status: statusFilter }
                })
            ]);
            setOverview(overviewRes.data);
            setPayments(paymentsRes.data.payments);
        } catch (error) {
            console.error('Failed to fetch finance data', error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefund = async (paymentId: string) => {
        if (!confirm('Are you sure you want to refund this payment? This action cannot be undone.')) return;

        setProcessingRefund(paymentId);
        try {
            await api.post(`/admin/finance/refund/${paymentId}`);
            alert('Refund initiated successfully');
            fetchData(); // Refresh list to see updated status if backend changed it
        } catch (error: any) {
            alert(error.response?.data?.message || 'Refund failed');
        } finally {
            setProcessingRefund(null);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Finance & Payments
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Track revenue, manage payments, and process refunds
                </p>
            </header>

            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Revenue"
                        value={`₹${overview.totalRevenue.toLocaleString()}`}
                        icon={<Banknote className="w-6 h-6 text-emerald-400" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Today's Revenue"
                        value={`₹${overview.todayRevenue.toLocaleString()}`}
                        icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
                        color="blue"
                    />
                    <StatCard
                        title="Successful Transactions"
                        value={overview.transactionStats.completed}
                        icon={<CheckCircle className="w-6 h-6 text-purple-400" />}
                        color="purple"
                    />
                </div>
            )}

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="ALL">All Status</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-medium text-xs uppercase tracking-wider">
                                <th className="p-5">User</th>
                                <th className="p-5">Exam</th>
                                <th className="p-5">Amount</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Date</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="p-5"><div className="h-10 bg-slate-800/50 rounded animate-pulse"></div></td></tr>
                                ))
                            ) : payments.length > 0 ? (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-5">
                                            <div className="font-bold text-white">{payment.user.name}</div>
                                            <div className="text-xs text-slate-500">{payment.user.email}</div>
                                        </td>
                                        <td className="p-5 text-slate-300">
                                            {payment.exam}
                                            <div className="text-xs text-slate-500 mt-1 font-mono">{payment.orderId}</div>
                                        </td>
                                        <td className="p-5 font-bold text-white">
                                            ₹{payment.amount}
                                        </td>
                                        <td className="p-5">
                                            <StatusBadge status={payment.status} />
                                        </td>
                                        <td className="p-5 text-slate-400 text-sm">
                                            {new Date(payment.date).toLocaleDateString()}
                                            <div className="text-xs text-slate-600">
                                                {new Date(payment.date).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            {payment.status === 'COMPLETED' && payment.paymentId && (
                                                <button
                                                    onClick={() => handleRefund(payment.paymentId!)}
                                                    disabled={processingRefund === payment.paymentId}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                                                >
                                                    <RefreshCcw className={`w-3 h-3 ${processingRefund === payment.paymentId ? 'animate-spin' : ''}`} />
                                                    Refund
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-slate-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Pagination */}
                <div className="p-4 border-t border-slate-800 flex justify-between items-center">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 text-sm"
                    >
                        Previous
                    </button>
                    <span className="text-slate-500 text-sm">Page {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={payments.length < 20}
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 text-sm"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    const colorClasses: { [key: string]: string } = {
        emerald: 'bg-emerald-500/10 text-emerald-500',
        blue: 'bg-blue-500/10 text-blue-500',
        purple: 'bg-purple-500/10 text-purple-500',
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-black text-white">{value}</div>
        </motion.div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'COMPLETED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" /> Paid
            </span>
        );
    }
    if (status === 'PENDING') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                <Clock className="w-3 h-3" /> Pending
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
            <XCircle className="w-3 h-3" /> Failed
        </span>
    );
}

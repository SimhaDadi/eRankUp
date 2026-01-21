'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Flag,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    MessageCircle,
    Filter
} from 'lucide-react';
import api from '@/lib/api';

interface QuestionFlag {
    id: string;
    questionId: string;
    questionPreview: string;
    reason: string;
    description: string;
    reportedBy: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: string;
    adminNotes?: string;
}

export default function QualityControlPage() {
    const [flags, setFlags] = useState<QuestionFlag[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [selectedFlag, setSelectedFlag] = useState<QuestionFlag | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [page, statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/quality/admin/flags', {
                params: { page, limit: 20, status: statusFilter }
            });
            setFlags(res.data.flags);
        } catch (error) {
            console.error('Failed to fetch flags', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/quality/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const handleStatusUpdate = async (status: 'resolved' | 'dismissed') => {
        if (!selectedFlag) return;

        try {
            await api.put(`/quality/admin/flag/${selectedFlag.id}`, {
                status,
                adminNotes
            });
            alert(`Flag marked as ${status}`);
            setSelectedFlag(null);
            setAdminNotes('');
            fetchData();
            fetchStats();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Quality Control
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Review and resolve user-reported issues with questions
                </p>
            </header>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Pending Reviews"
                        value={stats.pending}
                        icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
                        color="amber"
                    />
                    <StatCard
                        title="Resolved Issues"
                        value={stats.resolved}
                        icon={<CheckCircle className="w-6 h-6 text-emerald-400" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Total Reports"
                        value={stats.total}
                        icon={<Flag className="w-6 h-6 text-blue-400" />}
                        color="blue"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Flags List */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl overflow-hidden shadow-xl h-fit">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Flag className="w-5 h-5 text-slate-400" />
                            Reported Questions
                        </h2>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                            <option value="ALL">All Reports</option>
                        </select>
                    </div>

                    <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Loading reports...</div>
                        ) : flags.length > 0 ? (
                            flags.map((flag) => (
                                <div
                                    key={flag.id}
                                    onClick={() => setSelectedFlag(flag)}
                                    className={`p-5 cursor-pointer hover:bg-slate-800/50 transition-colors ${selectedFlag?.id === flag.id ? 'bg-slate-800/80' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${flag.reason === 'wrong_answer' ? 'bg-red-500/20 text-red-400' :
                                                flag.reason === 'typo' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                            {flag.reason.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(flag.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-white font-medium line-clamp-2 mb-2">{flag.questionPreview}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <MessageCircle className="w-3 h-3" />
                                        <span className="truncate">{flag.description}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-slate-500">
                                No reports found matching this filter.
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Panel */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl p-6 shadow-xl h-fit sticky top-24">
                    {selectedFlag ? (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-4">
                                Review Report
                            </h3>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Reported By</label>
                                <p className="text-white">{selectedFlag.reportedBy}</p>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Reason</label>
                                <p className="text-white capitalize">{selectedFlag.reason.replace('_', ' ')}</p>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">User Comment</label>
                                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg mt-1 text-sm">
                                    {selectedFlag.description}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Question Preview</label>
                                <div className="text-slate-300 p-3 rounded-lg border border-slate-700 mt-1 text-sm bg-slate-950/30">
                                    {selectedFlag.questionPreview}
                                    <div className="mt-2 text-right">
                                        <button className="text-blue-400 text-xs hover:underline">View Full Question</button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Admin Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes about resolution..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm mt-1 focus:ring-2 focus:ring-blue-500/50 outline-none h-24"
                                ></textarea>
                            </div>

                            {selectedFlag.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => handleStatusUpdate('dismissed')}
                                        className="py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('resolved')}
                                        className="py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors"
                                    >
                                        Mark Resolved
                                    </button>
                                </div>
                            )}
                            {selectedFlag.status !== 'pending' && (
                                <div className="p-3 bg-slate-800/50 rounded-lg text-center text-slate-400 text-sm">
                                    This report is <strong>{selectedFlag.status}</strong>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">
                            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Select a report to review</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    const colorClasses = {
        emerald: 'bg-emerald-500/10 text-emerald-500',
        blue: 'bg-blue-500/10 text-blue-500',
        amber: 'bg-amber-500/10 text-amber-500',
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

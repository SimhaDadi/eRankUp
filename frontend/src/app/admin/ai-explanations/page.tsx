'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    Edit3,
    ThumbsUp,
    ThumbsDown,
    Eye,
    TrendingUp,
    Filter,
    RefreshCw
} from 'lucide-react';
import api from '@/lib/api';

interface Explanation {
    id: string;
    questionId: string;
    questionContent: string;
    aiExplanation: string;
    adminApprovedExplanation: string | null;
    isVerified: boolean;
    helpfulCount: number;
    notHelpfulCount: number;
    averageRating: number;
    viewCount: number;
    createdAt: string;
}

interface Stats {
    total: number;
    verified: number;
    unverified: number;
    averageRating: number;
    totalViews: number;
    helpfulRate: number;
    feedback: {
        helpful: number;
        notHelpful: number;
    };
}

export default function AIExplanationsPage() {
    const [explanations, setExplanations] = useState<Explanation[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [explanationsRes, statsRes] = await Promise.all([
                api.get('/ai/explanations', {
                    params: filter !== 'all' ? { verified: filter === 'verified' } : {}
                }),
                api.get('/ai/explanations/stats')
            ]);

            setExplanations(explanationsRes.data.explanations);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, editedText?: string) => {
        try {
            await api.post(`/ai/explanations/${id}/approve`, {
                editedText: editedText || undefined
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Failed to approve:', error);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject and delete this explanation?')) return;

        try {
            await api.post(`/ai/explanations/${id}/reject`, {
                reason: 'Quality control'
            });
            fetchData();
        } catch (error) {
            console.error('Failed to reject:', error);
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            await api.put(`/ai/explanations/${id}`, {
                text: editText
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Failed to update:', error);
        }
    };

    const startEditing = (explanation: Explanation) => {
        setEditingId(explanation.id);
        setEditText(explanation.adminApprovedExplanation || explanation.aiExplanation);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <header className="flex flex-col gap-1">
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    AI Explanation Management
                </h1>
                <p className="text-slate-400 font-medium">
                    Review, approve, and manage AI-generated question explanations
                </p>
            </header>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<TrendingUp className="w-5 h-5 text-cyan-500" />}
                        label="Total Explanations"
                        value={stats.total}
                        color="cyan"
                    />
                    <StatCard
                        icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
                        label="Verified"
                        value={stats.verified}
                        color="emerald"
                    />
                    <StatCard
                        icon={<XCircle className="w-5 h-5 text-amber-500" />}
                        label="Unverified"
                        value={stats.unverified}
                        color="amber"
                    />
                    <StatCard
                        icon={<ThumbsUp className="w-5 h-5 text-purple-500" />}
                        label="Helpful Rate"
                        value={`${stats.helpfulRate}%`}
                        color="purple"
                    />
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'all'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    All ({stats?.total || 0})
                </button>
                <button
                    onClick={() => setFilter('verified')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'verified'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Verified ({stats?.verified || 0})
                </button>
                <button
                    onClick={() => setFilter('unverified')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'unverified'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Unverified ({stats?.unverified || 0})
                </button>
            </div>

            {/* Explanations List */}
            <div className="space-y-4">
                {explanations.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        No explanations found
                    </div>
                ) : (
                    explanations.map((explanation) => (
                        <motion.div
                            key={explanation.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl p-6 shadow-xl"
                        >
                            {/* Question */}
                            <div className="mb-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                        Question
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {explanation.isVerified ? (
                                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                                                ✓ Verified
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                                                ⚠ Pending Review
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-white font-medium">
                                    {explanation.questionContent}
                                </p>
                            </div>

                            {/* AI Explanation */}
                            <div className="mb-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {editingId === explanation.id ? 'Edit Explanation' : 'AI Generated Explanation'}
                                </h4>
                                {editingId === explanation.id ? (
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white font-medium resize-none"
                                        rows={6}
                                    />
                                ) : (
                                    <p className="text-slate-300 leading-relaxed">
                                        {explanation.adminApprovedExplanation || explanation.aiExplanation}
                                    </p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 mb-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-400">{explanation.viewCount} views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                                    <span className="text-slate-400">{explanation.helpfulCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ThumbsDown className="w-4 h-4 text-red-500" />
                                    <span className="text-slate-400">{explanation.notHelpfulCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">
                                        Rating: {explanation.averageRating.toFixed(1)}/5.0
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {editingId === explanation.id ? (
                                    <>
                                        <button
                                            onClick={() => handleUpdate(explanation.id)}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {!explanation.isVerified && (
                                            <button
                                                onClick={() => handleApprove(explanation.id)}
                                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => startEditing(explanation)}
                                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleReject(explanation.id)}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: any) {
    const colorClasses: { [key: string]: string } = {
        cyan: 'bg-cyan-500/10 shadow-cyan-500/5',
        emerald: 'bg-emerald-500/10 shadow-emerald-500/5',
        amber: 'bg-amber-500/10 shadow-amber-500/5',
        purple: 'bg-purple-500/10 shadow-purple-500/5'
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl shadow-black/20"
        >
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 ${colorClasses[color]} rounded-2xl shadow-inner`}>
                    {icon}
                </div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    {label}
                </span>
            </div>
            <div className="text-3xl font-black text-white leading-none">
                {value}
            </div>
        </motion.div>
    );
}

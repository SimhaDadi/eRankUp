'use client';

import { useEffect, useState, useCallback } from 'react';
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
    RefreshCw,
    Search,
    AlertCircle,
    BookOpen,
    Layers,
    Box
} from 'lucide-react';
import api from '@/lib/api';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

// Types
interface ExplanationItem {
    id: string;
    questionId: string;
    questionContent: string;
    subject?: string;
    chapter?: string;
    aiExplanation: string | null;
    adminApprovedExplanation: string | null;
    isVerified: boolean;
    status: 'pending' | 'generated' | 'verified';
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

interface FilterOption {
    id: string;
    title: string;
    subjectId?: string;
    chapterId?: string;
}

export default function AIExplanationsPage() {
    // Data State
    const [items, setItems] = useState<ExplanationItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Filter State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'generated' | 'verified'>('all');
    const [subjectId, setSubjectId] = useState('');
    const [chapterId, setChapterId] = useState('');
    const [modelId, setModelId] = useState('');

    // Metadata for filters
    const [subjects, setSubjects] = useState<FilterOption[]>([]);
    const [chapters, setChapters] = useState<FilterOption[]>([]);
    const [models, setModels] = useState<FilterOption[]>([]);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Fetch Metadata (Subjects, Models) on mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [subjectsRes, modelsRes] = await Promise.all([
                    api.get('/subjects'),
                    api.get('/models')
                ]);
                setSubjects(subjectsRes.data || []);
                setModels(modelsRes.data || []);
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch Chapters when Subject changes
    useEffect(() => {
        if (!subjectId) {
            setChapters([]);
            return;
        }
        const fetchChapters = async () => {
            try {
                const res = await api.get(`/chapters/subject/${subjectId}`);
                setChapters(res.data || []);
            } catch (error) {
                console.error('Failed to fetch chapters:', error);
            }
        };
        fetchChapters();
    }, [subjectId]);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Fetch Main Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            console.log('Fetching explanation data...');
            const [dataRes, statsRes] = await Promise.all([
                api.get('/explanations', {
                    params: {
                        search,
                        status: statusFilter,
                        subjectId: subjectId || undefined,
                        chapterId: chapterId || undefined,
                        modelId: modelId || undefined,
                        limit: 50
                    }
                }),
                api.get('/explanations/admin/stats')
            ]);

            setItems(dataRes.data?.items || []);
            setTotal(dataRes.data?.total || 0);
            setStats(statsRes.data || null);
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            setErrorMsg(JSON.stringify(error.response?.data || error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, subjectId, chapterId, modelId]); // Dependencies for refetch



    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);


    const handleApprove = async (id: string, editedText?: string) => {
        try {
            await api.post(`/explanations/${id}/approve`, {
                editedText: editedText || undefined
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            // If manual approval of a "pending" item (create new explanation) logic is needed, handle it here.
            // Usually dashboard handles "Verify" on existing. For pending, we might need "Generate" first.
            console.error('Failed to approve:', error);
        }
    };

    // Special handler for generating explanation for a pending question
    const handleGenerate = async (questionId: string) => {
        try {
            setLoading(true);
            await api.post(`/explanations/generate/${questionId}`);
            fetchData();
        } catch (error) {
            console.error('Failed to generate:', error);
            alert('Failed to generate explanation');
            setLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject and delete this explanation?')) return;
        try {
            await api.delete(`/explanations/${id}/reject`, {
                data: { reason: 'Quality control' }
            });
            fetchData();
        } catch (error) {
            console.error('Failed to reject:', error);
        }
    };

    const handleUpdate = async (id: string, questionId: string) => {
        try {
            // If it's a "missing-..." ID, we need to generate first or create.
            // But usually edit flow assumes existence.
            // If status is pending, we assume we are Creating.
            if (id.startsWith('missing-')) {
                // Create new logic if needed, but for now we rely on Generate first.
                alert('Please generate an AI explanation first before editing.');
                return;
            }

            await api.put(`/explanations/${id}`, {
                text: editText
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Failed to update:', error);
        }
    };

    const startEditing = (item: ExplanationItem) => {
        if (item.status === 'pending') {
            handleGenerate(item.questionId);
            return;
        }
        setEditingId(item.id);
        setEditText(item.adminApprovedExplanation || item.aiExplanation || '');
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Explanation Management
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Search, filter, and manage explanations for {total} questions
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            if (confirm('Generate missing explanations for 50 pending questions?')) {
                                try {
                                    await api.post('/explanations/generate-missing', { limit: 50 });
                                    alert('Background generation started!');
                                    fetchData();
                                } catch (e: any) {
                                    alert(e.message);
                                }
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Auto-Generate (50)</span>
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Error Banner */}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200">
                    <strong>Error:</strong> {errorMsg}
                </div>
            )}

            {/* Stats Cards */}
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
                        icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
                        label="Pending / Unverified"
                        value={stats.unverified} // Note: This stats object might need update from backend to count 'Pending' accurately
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

            {/* Search & Filters */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search questions or explanations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-white placeholder-slate-500 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending (No Explanation)</option>
                        <option value="generated">Generated (Unverified)</option>
                        <option value="verified">Verified</option>
                    </select>

                    {/* Subject Filter */}
                    <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <select
                            value={subjectId}
                            onChange={(e) => {
                                setSubjectId(e.target.value);
                                setChapterId(''); // Reset chapter
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                    </div>

                    {/* Chapter Filter */}
                    <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <select
                            value={chapterId}
                            onChange={(e) => setChapterId(e.target.value)}
                            disabled={!subjectId}
                            className={`w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer ${!subjectId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <option value="">All Chapters</option>
                            {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>

                    {/* Model Filter */}
                    <div className="relative">
                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <select
                            value={modelId}
                            onChange={(e) => setModelId(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                        >
                            <option value="">All Models</option>
                            {models
                                .filter(m => (!subjectId || m.subjectId === subjectId) && (!chapterId || m.chapterId === chapterId))
                                .map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {items.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-3xl">
                        <div className="flex justify-center mb-4"><Filter className="w-10 h-10 opacity-50" /></div>
                        No questions found matching your filters.
                    </div>
                ) : (
                    items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition-colors"
                        >
                            {/* Meta & Status */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/50">
                                <div className="flex gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {item.subject && <span className="bg-slate-800 px-2 py-1 rounded">{item.subject}</span>}
                                    {item.chapter && <span className="bg-slate-800 px-2 py-1 rounded">{item.chapter}</span>}
                                </div>
                                <div>
                                    {item.status === 'verified' && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                                            <CheckCircle className="w-3 h-3" /> Verified
                                        </span>
                                    )}
                                    {item.status === 'generated' && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold">
                                            <RefreshCw className="w-3 h-3" /> Generated
                                        </span>
                                    )}
                                    {item.status === 'pending' && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-400 rounded-full text-xs font-bold">
                                            <AlertCircle className="w-3 h-3" /> Pending
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Question</h3>
                                <MarkdownRenderer content={item.questionContent} className="text-white font-medium line-clamp-3" />
                            </div>

                            {item.status !== 'pending' && (
                                <div className="mb-6 bg-slate-950/30 rounded-xl p-4 border border-slate-800/50">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        {editingId === item.id ? 'Edit Explanation' : 'Explanation Preview'}
                                    </h3>
                                    {editingId === item.id ? (
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-medium resize-none focus:ring-1 focus:ring-cyan-500"
                                            rows={6}
                                        />
                                    ) : (
                                        <MarkdownRenderer
                                            content={item.adminApprovedExplanation || item.aiExplanation || ''}
                                            className="text-slate-300 text-sm line-clamp-3"
                                        />
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                {item.status !== 'pending' ? (
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.viewCount}</span>
                                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-emerald-500" /> {item.helpfulCount}</span>
                                        <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-red-500" /> {item.notHelpfulCount}</span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-amber-500 font-bold">
                                        Requires Generation
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {editingId === item.id ? (
                                        <>
                                            <button onClick={() => handleUpdate(item.id, item.questionId)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs">Save</button>
                                            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            {item.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleGenerate(item.questionId)}
                                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center gap-2"
                                                >
                                                    <RefreshCw className="w-3 h-3" /> Generate
                                                </button>
                                            ) : (
                                                <>
                                                    {!item.isVerified && (
                                                        <button onClick={() => handleApprove(item.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-2">
                                                            <CheckCircle className="w-3 h-3" /> Approve
                                                        </button>
                                                    )}
                                                    <button onClick={() => startEditing(item)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center gap-2">
                                                        <Edit3 className="w-3 h-3" /> Edit
                                                    </button>
                                                    <button onClick={() => handleReject(item.id)} className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg font-bold text-xs">
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
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

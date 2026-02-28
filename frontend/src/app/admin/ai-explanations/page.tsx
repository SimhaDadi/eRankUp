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
    HelpCircle,
    AlertCircle,
    BookOpen,
    Layers,
    AlertTriangle,
    Box,
    Bot,
    EyeOff
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
    isLogicalMismatch?: boolean;
    logicalSolveOutcome?: string;
    options?: { id: string; text: string }[];
    correctOptionId?: string;
    isMissingAnswerKey?: boolean;
    aiProposedAnswerId?: string;
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
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'generated' | 'verified' | 'mismatch'>('all');
    const [examId, setExamId] = useState('');  // [FIX] Added examId filter
    const [subjectId, setSubjectId] = useState('');
    const [chapterId, setChapterId] = useState('');
    const [modelId, setModelId] = useState('');

    // Metadata for filters
    const [exams, setExams] = useState<FilterOption[]>([]);  // [FIX] Added exams metadata
    const [subjects, setSubjects] = useState<FilterOption[]>([]);
    const [chapters, setChapters] = useState<FilterOption[]>([]);
    const [models, setModels] = useState<FilterOption[]>([]);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
    const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Fetch Metadata (Exams, Subjects, Models) on mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [examsRes, subjectsRes, modelsRes] = await Promise.all([
                    api.get('/exams'),  // [FIX] Fetch exams for Question Bank filter
                    api.get('/subjects'),
                    api.get('/models')
                ]);
                const examsData = examsRes.data?.data || examsRes.data;
                setExams(Array.isArray(examsData) ? examsData : []);
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
                        examId: examId || undefined,  // [FIX] Pass examId to API
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
    }, [search, statusFilter, examId, subjectId, chapterId, modelId]); // [FIX] Added examId dependency



    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);


    const handleApprove = async (id: string, editedText?: string) => {
        try {
            setApprovingIds(prev => new Set(prev).add(id));
            const res = await api.post(`/explanations/${id}/approve`, {
                editedText: editedText || undefined
            });
            const updatedItem = res.data.item;
            setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
            setEditingId(null);
            showNotification('success', 'Explanation approved and live!');
            setTimeout(() => fetchData(), 300);
        } catch (error: any) {
            console.error('Failed to approve:', error);
            showNotification('error', `Approval failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setApprovingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // Special handler for generating explanation for a pending question
    const handleGenerate = async (questionId: string, forceRegenerate = false) => {
        try {
            console.log(`[Dashboard] Starting generation for ${questionId} (force: ${forceRegenerate})`);
            setGeneratingIds(prev => new Set(prev).add(questionId));
            const res = await api.post(`/explanations/generate/${questionId}`, { forceRegenerate });
            const newItem = res.data.fullItem || { explanation: res.data.explanation };

            // 1. Optimistic/Immediate State Update
            setItems(prev => prev.map(item =>
                item.questionId === questionId ? { ...item, ...newItem } : item
            ));

            showNotification('success', 'Explanation generated successfully!');

            // 2. Delayed Global Refresh removed to prevent race conditions with optimistic update
        } catch (error: any) {
            console.error('Failed to generate:', error);
            showNotification('error', `Failed to generate: ${error.response?.data?.message || error.message}`);
        } finally {
            setGeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(questionId);
                return next;
            });
        }
    };

    const handleSyncLegacy = async () => {
        try {
            setLoading(true);
            const res = await api.post('/explanations/admin/backfill');
            showNotification('success', `Successfully synced ${res.data.synced} of ${res.data.total} legacy explanations!`);
            fetchData();
        } catch (error: any) {
            console.error('Sync failed:', error);
            showNotification('error', `Sync failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAI = async (id: string, questionId: string) => {
        try {
            setVerifyingIds(prev => new Set(prev).add(id));
            const res = await api.post(`/explanations/${id}/verify-ai`);

            if (res.data.isValid) {
                const updatedItem = res.data.item;
                setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
            } else {
                alert(`AI Audit Failed:\n${res.data.feedback}`);
            }
        } catch (error) {
            console.error('Failed to verify:', error);
            alert('AI Verification failed');
        } finally {
            setVerifyingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject and delete this explanation?')) return;
        try {
            setRejectingIds(prev => new Set(prev).add(id));
            await api.delete(`/explanations/${id}/reject`, {
                data: { reason: 'Quality control' }
            });
            setItems(prev => prev.filter(item => item.id !== id));
            showNotification('info', 'Explanation rejected and removed.');
            setTimeout(() => fetchData(), 300);
        } catch (error: any) {
            console.error('Failed to reject:', error);
            showNotification('error', `Rejection failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setRejectingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleFixCorrectOption = async (questionId: string, correctOptionId: string) => {
        try {
            setLoading(true);
            await api.patch(`/questions/${questionId}`, {
                correctAnswer: correctOptionId.charCodeAt(0) - 65 // Convert A to 0, B to 1...
            });
            showNotification('success', `Question answer key updated to ${correctOptionId}!`);

            // Refresh verified status if it was a mismatch
            await fetchData();
        } catch (error: any) {
            console.error('Failed to update answer key:', error);
            showNotification('error', `Failed to update answer key: ${error.message}`);
        } finally {
            setLoading(false);
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

            const res = await api.put(`/explanations/${id}`, {
                text: editText
            });
            const updatedItem = res.data.item;
            setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
            setEditingId(null);
            setTimeout(() => fetchData(), 300);
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
                        onClick={handleSyncLegacy}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                        title="Migrate legacy question explanations to the management table"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Sync Legacy</span>
                    </button>
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

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-8 right-8 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200' :
                    notification.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-200' :
                        'bg-indigo-900/90 border-indigo-500/50 text-indigo-200'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                        notification.type === 'error' ? <XCircle className="w-5 h-5" /> :
                            <Bot className="w-5 h-5" />}
                    <span className="font-bold">{notification.message}</span>
                </div>
            )}

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

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Question Bank (Exam) Filter */}
                    <select
                        value={examId}
                        onChange={(e) => {
                            setExamId(e.target.value);
                            // Reset dependent filters when exam changes
                            setSubjectId('');
                            setChapterId('');
                            setModelId('');
                        }}
                        className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                    >
                        <option value="">All Question Banks</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>

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
                        <option value="mismatch">Logic Mismatches ⚠️</option>
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
                                    {item.isLogicalMismatch && !item.isMissingAnswerKey && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">
                                            <AlertTriangle className="w-3 h-3" /> Logic Mismatch ⚠️
                                        </span>
                                    )}
                                    {item.isMissingAnswerKey && (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold border border-amber-500/30">
                                            <HelpCircle className="w-3 h-3" /> No Answer Key 🔍
                                        </span>
                                    )}
                                    {(item.adminApprovedExplanation || item.isVerified) ? (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/30 ml-2">
                                            <Eye className="w-3 h-3" /> Live for Students
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-slate-500 rounded-full text-xs font-bold border border-slate-700 ml-2">
                                            <EyeOff className="w-3 h-3" /> Hidden from Students
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Question</h3>
                                    <button
                                        onClick={() => toggleExpand(`q-${item.questionId}`)}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                                    >
                                        {expandedIds.has(`q-${item.questionId}`) ? 'Collapse' : 'Expand'}
                                    </button>
                                </div>
                                <MarkdownRenderer
                                    content={item.questionContent}
                                    className={`text-white font-medium ${expandedIds.has(`q-${item.questionId}`) ? '' : 'line-clamp-3'}`}
                                />

                                {/* Question Options */}
                                {item.options && item.options.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 ml-1">
                                        {item.options.map(opt => {
                                            const isCorrect = opt.id === item.correctOptionId;
                                            const isProposed = opt.id === item.aiProposedAnswerId && opt.id !== item.correctOptionId;

                                            return (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => {
                                                        if (confirm(`Set option ${opt.id} as the correct answer?`)) {
                                                            handleFixCorrectOption(item.questionId, opt.id);
                                                        }
                                                    }}
                                                    className={`text-[11px] p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:border-indigo-500/50 ${isCorrect
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)]'
                                                        : isProposed
                                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                                                            : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                                                        }`}
                                                >
                                                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md mr-2 text-[10px] font-mono ${isCorrect
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : isProposed
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : 'bg-slate-800 text-slate-500'
                                                        }`}>
                                                        {opt.id}
                                                    </span>
                                                    {opt.text}
                                                    {isCorrect && (
                                                        <CheckCircle className="w-3 h-3 inline ml-2 text-emerald-500 animate-pulse" />
                                                    )}
                                                    {isProposed && (
                                                        <HelpCircle className="w-3 h-3 inline ml-2 text-amber-500 animate-pulse" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {item.status !== 'pending' && (
                                <div className="mb-6 bg-slate-950/30 rounded-xl p-4 border border-slate-800/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {editingId === item.id ? 'Edit Explanation' : 'Explanation Preview'}
                                        </h3>
                                        {editingId !== item.id && (
                                            <button
                                                onClick={() => toggleExpand(`e-${item.questionId}`)}
                                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                                            >
                                                {expandedIds.has(`e-${item.questionId}`) ? 'Collapse' : 'Expand'}
                                            </button>
                                        )}
                                    </div>
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
                                            className={`text-slate-300 text-sm ${expandedIds.has(`e-${item.questionId}`) ? '' : 'line-clamp-2'}`}
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
                                                    disabled={generatingIds.has(item.questionId)}
                                                    className={`px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 ${generatingIds.has(item.questionId) ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${generatingIds.has(item.questionId) ? 'animate-spin' : ''}`} />
                                                    {generatingIds.has(item.questionId) ? 'Generating...' : 'Generate'}
                                                </button>
                                            ) : (
                                                <>
                                                    {!item.isVerified && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApprove(item.id);
                                                                }}
                                                                disabled={approvingIds.has(item.id)}
                                                                className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 ${approvingIds.has(item.id) ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                            >
                                                                <CheckCircle className={`w-3 h-3 ${approvingIds.has(item.id) ? 'animate-spin' : ''}`} />
                                                                {approvingIds.has(item.id) ? 'Approving...' : 'Approve'}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleVerifyAI(item.id, item.questionId);
                                                                }}
                                                                disabled={verifyingIds.has(item.id)}
                                                                className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 ${verifyingIds.has(item.id) ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                            >
                                                                <Bot className={`w-3 h-3 ${verifyingIds.has(item.id) ? 'animate-pulse' : ''}`} />
                                                                {verifyingIds.has(item.id) ? 'Auditing...' : 'Audit'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.isVerified && item.isLogicalMismatch && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleVerifyAI(item.id, item.questionId);
                                                            }}
                                                            disabled={verifyingIds.has(item.id)}
                                                            className={`px-4 py-2 bg-slate-800 hover:bg-indigo-900/40 text-indigo-300 rounded-lg font-bold text-xs flex items-center gap-2 border border-indigo-500/30 ${verifyingIds.has(item.id) ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                            title="Refresh logical audit to find the proposed answer"
                                                        >
                                                            <RefreshCw className={`w-3 h-3 ${verifyingIds.has(item.id) ? 'animate-spin' : ''}`} />
                                                            {verifyingIds.has(item.id) ? 'Re-Auditing...' : 'Re-Audit'}
                                                        </button>
                                                    )}
                                                    {item.isLogicalMismatch && item.aiProposedAnswerId && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFixCorrectOption(item.questionId, item.aiProposedAnswerId!);
                                                            }}
                                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                                                            title={`Set correct answer to ${item.aiProposedAnswerId} based on AI logic`}
                                                        >
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Quick Fix ({item.aiProposedAnswerId})
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleGenerate(item.questionId, true);
                                                        }}
                                                        disabled={generatingIds.has(item.questionId)}
                                                        className={`px-4 py-2 bg-cyan-900/50 hover:bg-cyan-900 text-cyan-200 rounded-lg font-bold text-xs flex items-center gap-2 border border-cyan-500/30 ${generatingIds.has(item.questionId) ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                        title="Force AI to regenerate explanation"
                                                    >
                                                        <RefreshCw className={`w-3 h-3 ${generatingIds.has(item.questionId) ? 'animate-spin' : ''}`} />
                                                        {generatingIds.has(item.questionId) ? 'Regenerating...' : 'Regenerate'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditing(item);
                                                        }}
                                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center gap-2"
                                                    >
                                                        <Edit3 className="w-3 h-3" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReject(item.id);
                                                        }}
                                                        disabled={rejectingIds.has(item.id)}
                                                        className={`px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg font-bold text-xs flex items-center gap-2 ${rejectingIds.has(item.id) ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                    >
                                                        {rejectingIds.has(item.id) ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                                                        {rejectingIds.has(item.id) ? 'Rejecting...' : 'Reject'}
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
        </div >
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

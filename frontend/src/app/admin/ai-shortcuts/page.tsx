'use client';
import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface Shortcut {
    id: string;
    topic: string;
    keywords: string;
    formula: string;
    isActive: boolean;
    createdAt: string;
}

export default function AIShortcutsPage() {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'error' } | null>(null);

    // Form State
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [formula, setFormula] = useState('');

    // Testing State
    const [testQuery, setTestQuery] = useState('');
    const [testResult, setTestResult] = useState<any>(null);
    const [testingFlag, setTestingFlag] = useState(false);
    const [hasTested, setHasTested] = useState(false);

    useEffect(() => {
        fetchShortcuts();
    }, []);

    const showToast = (title: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ title, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fetchShortcuts = async () => {
        try {
            const res = await api.get('/ai/shortcuts');
            setShortcuts(res.data);
        } catch (error) {
            showToast('Error loading shortcuts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { topic, keywords, formula };
            if (isEditing) {
                await api.put(`/ai/shortcuts/${isEditing}`, payload);
                showToast('Shortcut updated successfully');
            } else {
                await api.post('/ai/shortcuts', payload);
                showToast('Shortcut created successfully');
            }
            resetForm();
            fetchShortcuts();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error saving shortcut';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (shortcut: Shortcut) => {
        setIsEditing(shortcut.id);
        setTopic(shortcut.topic);
        setKeywords(shortcut.keywords);
        setFormula(shortcut.formula);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shortcut?')) return;
        try {
            await api.delete(`/ai/shortcuts/${id}`);
            showToast('Shortcut deleted');
            fetchShortcuts();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/ai/shortcuts/${id}`, { isActive: !currentStatus });
            setShortcuts(shortcuts.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
            showToast(`Shortcut ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const resetForm = () => {
        setIsEditing(null);
        setTopic('');
        setKeywords('');
        setFormula('');
    };

    const runTest = async () => {
        if (!testQuery) return;
        setTestingFlag(true);
        setHasTested(false);
        try {
            const res = await api.get(`/ai/shortcuts/test-rag?topic=Test&content=${encodeURIComponent(testQuery)}`);
            setTestResult(res.data);
            setHasTested(true);
        } catch (error: any) {
            showToast('Test Failed', 'error');
        } finally {
            setTestingFlag(false);
        }
    }

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[500px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
            {toastMessage && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${toastMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                    {toastMessage.title}
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">AI Math Shortcuts (RAG Data)</h1>
                <p className="text-slate-400 mt-2 max-w-3xl">
                    Manage the semantic shortcut database. The AI Generative system will automatically query these formulas during math/quant generation to prevent hallucination loops.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Editor Column */}
                <div className="lg:col-span-1 h-fit sticky top-6 bg-[#161c28] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-slate-800 bg-[#1a2234]">
                        <h2 className="text-lg font-bold text-slate-100">{isEditing ? 'Edit Shortcut' : 'New Math Shortcut'}</h2>
                        <p className="text-sm text-slate-400 mt-1">Saves immediately to Vector DB.</p>
                    </div>
                    <div className="p-5">
                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Topic Name</label>
                                <input
                                    required
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Problems on Trains"
                                    className="w-full bg-[#0c111d] border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Semantic Keywords (Optional)</label>
                                <input
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="e.g. geometry, pythagoras"
                                    className="w-full bg-[#0c111d] border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                />
                                <p className="text-xs text-slate-500">Comma separated concepts used for semantic matching.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Shortcut / Injection Rule</label>
                                <textarea
                                    required
                                    value={formula}
                                    onChange={(e) => setFormula(e.target.value)}
                                    placeholder="Distance = Length of Train + Length of Platform. Speed = (Lt + Lp) / Time..."
                                    className="w-full min-h-[150px] bg-[#0c111d] border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm placeholder:text-slate-600 resize-y"
                                />
                            </div>

                            <div className="pt-2 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {saving ? 'Embedding to Space...' : isEditing ? 'Update Shortcut' : 'Add Shortcut'}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List & Test Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Test Harness */}
                    <div className="bg-[#1a2b22]/30 border border-emerald-900/50 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-emerald-900/30 bg-[#122319]/50 flex items-center gap-2">
                            <Play className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-md font-bold text-emerald-400">Test Vector Retrieval</h2>
                        </div>
                        <div className="p-5">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    value={testQuery}
                                    onChange={(e) => setTestQuery(e.target.value)}
                                    placeholder="Paste a dummy SSC question to see what the AI retrieves..."
                                    className="flex-1 bg-[#0c111d] border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                />
                                <button
                                    onClick={runTest}
                                    disabled={testingFlag || !testQuery}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                                >
                                    {testingFlag ? 'Searching...' : 'Search Vector DB'}
                                </button>
                            </div>

                            {testResult && (
                                <div className="mt-4 p-4 rounded-lg border border-emerald-800/60 bg-emerald-950/20 shadow-inner">
                                    <div className="text-emerald-400 font-bold mb-2 flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4" /> Matched Entity
                                    </div>
                                    <div className="font-semibold text-slate-200">{testResult.topic}</div>
                                    <div className="text-slate-400 mt-2 font-mono text-sm whitespace-pre-wrap leading-relaxed bg-[#0c111d]/50 p-3 rounded border border-slate-800">
                                        {testResult.formula}
                                    </div>
                                </div>
                            )}

                            {hasTested && !testResult && (
                                <div className="mt-4 p-4 rounded-lg border border-amber-900/40 bg-amber-950/20 text-amber-500 text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> No relevant shortcut found in DB for this query. Attempting general zero-shot generation.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Database List */}
                    <div className="bg-[#161c28] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-slate-800 bg-[#1a2234]">
                            <h2 className="text-lg font-bold text-slate-100">Live Database ({shortcuts.length})</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            {shortcuts.length === 0 ? (
                                <div className="text-slate-500 text-center py-12 bg-[#0c111d]/50 rounded-lg border border-dashed border-slate-700">
                                    Database is empty. Add a shortcut visually on the left.
                                </div>
                            ) : (
                                shortcuts.map(shortcut => (
                                    <div key={shortcut.id} className={`border rounded-lg p-5 flex flex-col md:flex-row justify-between gap-6 transition-all ${shortcut.isActive ? 'border-slate-700 bg-[#1a2234]/50' : 'border-slate-800 bg-[#0c111d] opacity-60'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-slate-200 text-lg">{shortcut.topic}</h3>
                                                {shortcut.keywords && (
                                                    <span className="text-xs px-2.5 py-1 rounded-md bg-blue-900/30 text-blue-400 border border-blue-800/50 truncate max-w-[200px]">
                                                        {shortcut.keywords}
                                                    </span>
                                                )}
                                                {!shortcut.isActive && (
                                                    <span className="text-xs px-2.5 py-1 rounded-md bg-rose-900/30 text-rose-400 border border-rose-800/50">
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400 font-mono whitespace-pre-wrap line-clamp-3 bg-[#0c111d]/50 p-3 rounded mt-2">
                                                {shortcut.formula}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 md:self-start shrink-0 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                                            <button
                                                onClick={() => toggleActive(shortcut.id, shortcut.isActive)}
                                                className={`text-sm px-3 py-1.5 rounded-md border font-medium transition-colors ${shortcut.isActive ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-emerald-800/60 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40'}`}
                                            >
                                                {shortcut.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(shortcut)}
                                                className="p-2 mr-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(shortcut.id)}
                                                className="p-2 rounded-md bg-rose-950/30 text-rose-500 hover:bg-rose-900/50 hover:text-rose-400 transition-colors border border-rose-900/30"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

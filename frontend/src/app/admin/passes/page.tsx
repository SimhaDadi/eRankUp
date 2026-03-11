'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Search,
    CreditCard,
    Clock,
    ChevronRight,
    Sparkles,
    AlertCircle,
    X
} from 'lucide-react';
import api from '@/lib/api';

// Enum for PassType matching backend
enum PassType {
    SUBSCRIPTION = 'SUBSCRIPTION',
    ONE_TIME = 'ONE_TIME',
    LIFETIME = 'LIFETIME'
}

interface Pass {
    id?: string;
    title: string;
    description: string;
    price: number;
    durationDays: number;
    features: string[];
    isActive: boolean;
    isPopular: boolean;
    passType: PassType;
    sortOrder: number;
    maxExams: number;
}

export default function AdminPassesPage() {
    const [passes, setPasses] = useState<Pass[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPass, setEditingPass] = useState<Pass | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPasses();
    }, []);

    const fetchPasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/passes');
            setPasses(res.data);
        } catch (error) {
            console.error('Failed to fetch passes', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (pass: Pass | null = null) => {
        setEditingPass(pass || {
            title: '',
            description: '',
            price: 0,
            durationDays: 30,
            features: [],
            isActive: true,
            isPopular: false,
            passType: PassType.SUBSCRIPTION,
            sortOrder: 0,
            maxExams: 0
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pass? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/passes/${id}`);
            fetchPasses();
        } catch (error) {
            alert('Failed to delete pass');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPass) return;

        setIsSubmitting(true);
        try {
            if (editingPass.id) {
                await api.patch(`/admin/passes/${editingPass.id}`, editingPass);
            } else {
                await api.post('/admin/passes', editingPass);
            }
            setIsModalOpen(false);
            fetchPasses();
        } catch (error) {
            alert('Failed to save pass');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPasses = passes.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Passes & Plans
                    </h1>
                    <p className="text-slate-400 font-medium mt-2">
                        Manage membership tiers, pricing, and features
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Create New Plan
                </button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Active Plans"
                    value={passes.filter(p => p.isActive).length}
                    icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
                />
                <StatCard
                    title="Popular Plans"
                    value={passes.filter(p => p.isPopular).length}
                    icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                />
                <StatCard
                    title="Total Plans"
                    value={passes.length}
                    icon={<CreditCard className="w-5 h-5 text-blue-400" />}
                />
            </div>

            {/* Main Table Container */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search plans..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                <th className="p-5">Plan Detail</th>
                                <th className="p-5">Pricing</th>
                                <th className="p-5">Validity</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="p-5"><div className="h-16 bg-slate-800/50 rounded-2xl animate-pulse"></div></td></tr>
                                ))
                            ) : filteredPasses.length > 0 ? (
                                filteredPasses.map((pass) => (
                                    <tr key={pass.id} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pass.isPopular ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                                    {pass.isPopular ? <Sparkles className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-base">{pass.title}</div>
                                                    <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs">{pass.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 font-black text-white text-lg">
                                            ₹{pass.price}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-slate-300 font-medium whitespace-nowrap">
                                                <Clock className="w-4 h-4 text-slate-500" />
                                                {pass.durationDays} Days
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {pass.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-widest">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(pass)}
                                                    className="p-2.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pass.id!)}
                                                    className="p-2.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <AlertCircle className="w-12 h-12 text-slate-700" />
                                            <p className="text-slate-500 font-bold">No plans found. Create your first membership tier!</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-[#0c111d]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-white">{editingPass?.id ? 'Edit Plan' : 'Create Plan'}</h2>
                                    <p className="text-slate-500 text-sm font-medium">Define your membership benefits and pricing</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Plan Title</label>
                                        <input
                                            required
                                            value={editingPass?.title}
                                            onChange={e => setEditingPass(prev => ({ ...prev!, title: e.target.value }))}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                            placeholder="e.g. Annual Elite"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Plan Type</label>
                                        <select
                                            value={editingPass?.passType}
                                            onChange={e => setEditingPass(prev => ({ ...prev!, passType: e.target.value as PassType }))}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                        >
                                            <option value={PassType.SUBSCRIPTION}>Subscription</option>
                                            <option value={PassType.ONE_TIME}>One-Time</option>
                                            <option value={PassType.LIFETIME}>Lifetime</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Description</label>
                                    <textarea
                                        required
                                        value={editingPass?.description}
                                        onChange={e => setEditingPass(prev => ({ ...prev!, description: e.target.value }))}
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium h-24 resize-none"
                                        placeholder="Explain what's special about this plan..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            value={editingPass?.price}
                                            onChange={e => setEditingPass(prev => ({ ...prev!, price: Number(e.target.value) }))}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-black"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Validity (Days)</label>
                                        <input
                                            type="number"
                                            required
                                            value={editingPass?.durationDays}
                                            onChange={e => setEditingPass(prev => ({ ...prev!, durationDays: Number(e.target.value) }))}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-black"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Sort Order</label>
                                        <input
                                            type="number"
                                            value={editingPass?.sortOrder}
                                            onChange={e => setEditingPass(prev => ({ ...prev!, sortOrder: Number(e.target.value) }))}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-black"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div
                                        onClick={() => setEditingPass(prev => ({ ...prev!, isActive: !prev?.isActive }))}
                                        className="flex items-center gap-3 cursor-pointer group p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-blue-500/50 transition-all"
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingPass?.isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 bg-slate-800'}`}
                                        >
                                            {editingPass?.isActive && <CheckCircle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Active Plan</div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Visible to students</div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setEditingPass(prev => ({ ...prev!, isPopular: !prev?.isPopular }))}
                                        className="flex items-center gap-3 cursor-pointer group p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/50 transition-all"
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${editingPass?.isPopular ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-700 bg-slate-800'}`}
                                        >
                                            {editingPass?.isPopular && <Sparkles className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Popular Tag</div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Featured badge</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Features List</label>
                                    <FeatureManager
                                        features={editingPass?.features || []}
                                        setFeatures={(f) => setEditingPass(prev => ({ ...prev!, features: f }))}
                                    />
                                </div>

                                <div className="pt-8 flex gap-4 sticky bottom-0 bg-slate-900 pb-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Plan & Go Live'}
                                        {!isSubmitting && <ChevronRight className="w-5 h-5" />}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FeatureManager({ features, setFeatures }: { features: string[], setFeatures: (f: string[]) => void }) {
    const [inputValue, setInputValue] = useState('');

    const addFeature = () => {
        if (!inputValue.trim()) return;
        setFeatures([...features, inputValue.trim()]);
        setInputValue('');
    };

    const removeFeature = (idx: number) => {
        setFeatures(features.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                        }
                    }}
                    placeholder="Type a feature and press Enter..."
                    className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 px-4 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
                <button
                    type="button"
                    onClick={addFeature}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 rounded-xl transition-all"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-xl group hover:border-slate-500 transition-all">
                        <span className="text-xs font-bold text-slate-300">{f}</span>
                        <button type="button" onClick={() => removeFeature(i)} className="text-slate-500 hover:text-rose-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }: any) {
    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl flex items-center justify-between">
            <div>
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
                <div className="text-3xl font-black text-white">{value}</div>
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700/50">
                {icon}
            </div>
        </div>
    );
}

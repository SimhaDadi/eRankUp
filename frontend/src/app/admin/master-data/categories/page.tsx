'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Tag, Edit, Trash, X, Loader2, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

interface Category {
    id: string;
    name: string;
    slug: string;
    isVisible: boolean;
    order: number;
    _count?: { exams: number };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', slug: '', isVisible: true, order: 0 });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            // Fetch admin view (all categories)
            const response = await api.get('/categories/admin');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            isVisible: category.isVisible,
            order: category.order
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category', error);
            alert('Failed to delete category');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingCategory) {
                await api.patch(`/categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/categories', formData);
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            setFormData({ name: '', slug: '', isVisible: true, order: 0 });
            fetchCategories();
        } catch (error) {
            console.error('Failed to save category', error);
            alert('Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-generate slug
    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, name, slug: editingCategory ? prev.slug : slug }));
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Tag className="w-8 h-8 text-cyan-500" />
                        Categories
                    </h1>
                    <p className="text-slate-400 mt-1">Manage exam categories (Master Data).</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '', slug: '', isVisible: true, order: 0 });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Category</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
                <Search className="w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search visible or hidden categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-200 w-full placeholder:text-slate-600"
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                </div>
            ) : (
                <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 font-bold">
                                <th className="p-4 w-16 text-center">Order</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-4 text-center font-mono text-slate-500">{category.order}</td>
                                    <td className="p-4 font-bold text-white">{category.name}</td>
                                    <td className="p-4 font-mono text-xs text-sky-400 bg-sky-950/30 px-2 py-1 rounded w-fit">{category.slug}</td>
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${category.isVisible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                            {category.isVisible ? (
                                                <> <Eye className="w-3 h-3" /> Visible </>
                                            ) : (
                                                <> <EyeOff className="w-3 h-3" /> Hidden </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="p-2 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        No categories found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0c111d] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <h3 className="text-xl font-bold text-white">
                                    {editingCategory ? 'Edit Category' : 'New Category'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="e.g. SSC CGL"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-2">Slug (Unique ID)</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-xs focus:border-cyan-500 outline-none transition-all"
                                            placeholder="ssc-cgl"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-2">Sort Order</label>
                                        <input
                                            type="number"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${formData.isVisible ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                    >
                                        <motion.div
                                            animate={{ x: formData.isVisible ? 24 : 2 }}
                                            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                                        />
                                    </button>
                                    <label className="text-sm font-medium text-slate-300 cursor-pointer" onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}>
                                        Is Visible to Students?
                                    </label>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Category'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

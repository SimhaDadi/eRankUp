'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Edit2, X, UploadCloud, Globe, RefreshCcw } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    category: string; // e.g., 'National', 'International', 'Sports', 'Science'
    imageUrl: string;
    source: string;
    publishedAt: string;
    tags: string[];
}

export default function AdminNewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        category: 'National',
        imageUrl: '',
        source: '',
        tags: '',
    });

    const fetchNews = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/news');
            setNews(res.data.items);
        } catch (error) {
            console.error('Failed to fetch news', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNewsId(null);
        setFormData({ title: '', summary: '', content: '', category: 'National', imageUrl: '', source: '', tags: '' });
    };

    const handleEdit = (item: NewsItem) => {
        setEditingNewsId(item.id);
        setFormData({
            title: item.title,
            summary: item.summary,
            content: item.content,
            category: item.category || 'National',
            imageUrl: item.imageUrl || '',
            source: item.source || '',
            tags: item.tags?.join(', ') || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this news update?')) return;
        try {
            await api.delete(`/news/${id}`);
            fetchNews();
        } catch (error) {
            console.error('Failed to delete news', error);
            alert('Failed to delete news');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        };

        try {
            if (editingNewsId) {
                await api.patch(`/news/${editingNewsId}`, payload);
            } else {
                await api.post('/news', payload);
            }
            handleCloseModal();
            fetchNews();
        } catch (error) {
            console.error('Failed to post news', error);
            alert('Failed to post news');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">News Management</h1>
                    <p className="text-slate-400">Post and manage current affairs updates.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingNewsId(null);
                        setFormData({ title: '', summary: '', content: '', category: 'National', imageUrl: '', source: '', tags: '' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold transition-colors"
                >
                    <Plus className="w-4 h-4" /> Post Update
                </button>
            </div>

            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    <div className="flex justify-center items-center gap-2">
                                        <RefreshCcw className="w-4 h-4 animate-spin" /> Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : news.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        {item.imageUrl && (
                                            <div className="relative w-10 h-10 shrink-0">
                                                <Image 
                                                    src={item.imageUrl} 
                                                    alt={item.title} 
                                                    fill 
                                                    className="rounded-lg object-cover bg-slate-800"
                                                    unoptimized
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-white line-clamp-1">{item.title}</div>
                                            <div className="text-xs text-slate-500 line-clamp-1">{item.summary}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-bold border border-slate-700">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400">
                                    {new Date(item.publishedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-xs font-bold border border-emerald-500/20">
                                        Published
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-3">
                                        <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Edit Update">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete Update">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                                <h2 className="text-xl font-black text-white">{editingNewsId ? 'Edit Update' : 'Post New Update'}</h2>
                                <button onClick={handleCloseModal} className="text-slate-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500 font-medium"
                                            >
                                                <option value="National">National</option>
                                                <option value="International">International</option>
                                                <option value="Sports">Sports</option>
                                                <option value="Science & Tech">Science & Tech</option>
                                                <option value="Economy">Economy</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Source / Agency</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. PIB, The Hindu"
                                                value={formData.source}
                                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Headline</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Enter catchy headline"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500 text-lg font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Short Summary (60 words)</label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder="Brief overview for the card..."
                                            value={formData.summary}
                                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-300 outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Full Content (HTML Supported)</label>
                                        <textarea
                                            required
                                            rows={6}
                                            placeholder="<p>Detailed article content...</p>"
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-300 outline-none focus:border-blue-500 font-mono text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Image URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={formData.imageUrl}
                                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-400 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Tags (Comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="Budget, Education, Policy"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (editingNewsId ? 'Saving...' : 'Posting...') : (editingNewsId ? 'Save Changes' : 'Publish Update')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

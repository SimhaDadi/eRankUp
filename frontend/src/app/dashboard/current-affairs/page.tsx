'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Tag, ChevronRight, X, Clock, Globe } from 'lucide-react';
import api from '@/lib/api';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string;
    category: string;
    imageUrl?: string;
    source?: string;
    publishedAt: string;
    tags?: string[];
}

export default function CurrentAffairsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    useEffect(() => {
        fetchNews();
    }, [selectedCategory]);

    const fetchNews = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/news', {
                params: { category: selectedCategory === 'All' ? undefined : selectedCategory }
            });
            setNews(res.data.items);
        } catch (error) {
            console.error('Failed to fetch news', error);
        } finally {
            setIsLoading(false);
        }
    };

    const categories = ['All', 'National', 'International', 'Sports', 'Science & Tech', 'Economy'];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
            {/* Header */}
            <div className="mb-10 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Current Affairs</h1>
                        <p className="text-slate-500 font-medium">Daily updates to keep you ahead of the curve.</p>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105'
                                : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feed */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white h-80 rounded-3xl animate-pulse shadow-sm border border-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedNews(item)}
                            className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
                        >
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                        <Globe className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 shadow-sm border border-white/50">
                                    {item.category}
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                    {item.title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 bg-gradient-to-b from-slate-500 to-transparent bg-clip-text text-transparent opacity-80">
                                    {item.summary}
                                </p>
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(item.publishedAt).toLocaleDateString()}
                                    </div>
                                    <button className="text-blue-600 text-xs font-black uppercase tracking-wider flex items-center gap-1 group/btn">
                                        Read More <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Reading Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedNews(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative h-64 shrink-0 bg-slate-900">
                                {selectedNews.imageUrl && (
                                    <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-cover opacity-80" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 p-8">
                                    <div className="flex items-center gap-3 mb-3 text-white/80 text-sm font-bold">
                                        <span className="bg-blue-600/90 px-3 py-1 rounded-lg backdrop-blur text-white">{selectedNews.category}</span>
                                        <span>•</span>
                                        <span>{new Date(selectedNews.publishedAt).toDateString()}</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white leading-tight shadow-black drop-shadow-lg">
                                        {selectedNews.title}
                                    </h2>
                                </div>
                            </div>

                            <div className="overflow-y-auto p-8 md:p-10 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                                <div className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-p:text-slate-600 prose-a:text-blue-600">
                                    <div dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
                                </div>

                                {selectedNews.tags && (
                                    <div className="pt-8 flex flex-wrap gap-2 border-t border-slate-100">
                                        {selectedNews.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-600 text-sm font-bold rounded-lg border border-slate-100">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

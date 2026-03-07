'use client';
import 'reflect-metadata';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BookOpen, Search, Filter, Eye, Play, Plus, Trash2, Edit, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import Link from 'next/link';
import { EXAM_CATEGORIES } from '@erankup/shared';
import { generateExamPDF } from '@/utils/pdfGenerator';

export default function PreviousYearPapersPage() {
    const [papers, setPapers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                const res = await api.get('/exams?type=previous_year_paper');
                const data = res.data;
                const allExams = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                const publishedPapers = allExams.filter((p: any) => p.isPublished);
                setPapers(publishedPapers);

                if (publishedPapers.length > 0) {
                    const cats = Array.from(new Set(publishedPapers.map((p: any) => p.category || 'Other')));
                    if (cats.includes('SSC')) setActiveCategory('SSC');
                    else if (cats.length > 0) setActiveCategory(cats[0] as string);
                }
            } catch (error) {
                console.error("Failed to fetch papers", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPapers();
    }, []);

    const categories = ['All', ...Array.from(new Set(papers.map(p => p.category || 'Other')))].filter(c => c !== 'All' || papers.length > 0);
    // Actually, distinct categories from papers + 'All' if we want.
    // Let's just use the distinct categories found in data.
    const distinctCategories = Array.from(new Set(papers.map(p => p.category || 'Other')));



    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this paper?')) {
            try {
                await api.delete(`/exams/${id}`);
                setPapers(papers.filter(p => p.id !== id));
            } catch (error) {
                alert('Failed to delete paper');
            }
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/exams/${id}/publish`, { isPublished: !currentStatus });
            setPapers(papers.map(p => p.id === id ? { ...p, isPublished: !currentStatus } : p));
        } catch (error) {
            alert('Failed to update publish status');
        }
    };

    const handleExportCSV = async (id: string, title: string) => {
        try {
            const response = await api.get(`/exams/${id}/export/csv`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pyp-${title.replace(/\s+/g, '-').toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export CSV", error);
            alert('Failed to export CSV');
        }
    };

    const filteredPapers = (activeCategory === 'All'
        ? papers
        : papers.filter(p => (p.category || 'Other') === activeCategory))
        .filter(p => p.title.toLowerCase().includes('')); // Add search state if needed, or just keep category filter

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500 animate-pulse">Loading papers...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Previous Year Papers</h1>
                        <p className="text-slate-400">Manage published previous year exam papers.</p>
                    </div>
                    <Link href="/admin/exams">
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                            <Plus className="w-5 h-5" /> Create New (Drafts)
                        </button>
                    </Link>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {distinctCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeCategory === category
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                                }`}
                        >
                            {EXAM_CATEGORIES.find(c => c.id === category)?.label || category}
                        </button>
                    ))}
                </div>

                {/* Papers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPapers.map((paper, index) => (
                        <motion.div
                            key={paper.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-amber-500/50 transition-all group relative"
                        >
                            <div className="absolute top-4 right-4 z-10 flex gap-2">
                                <button
                                    onClick={() => handleExportCSV(paper.id, paper.title)}
                                    className="p-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                                    title="Export Question Paper (CSV)"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleTogglePublish(paper.id, paper.isPublished)}
                                    className="p-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                    title="Unpublish (Move to Drafts)"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(paper.id)}
                                    className="p-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start mb-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                                    <FileText className="w-6 h-6 text-amber-500" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 min-h-[56px] pr-16">{paper.title}</h3>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-1">{paper.description || 'Official Previous Year Paper'}</p>

                            <div className="space-y-2 mb-6 border-t border-slate-800 pt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <span>
                                        {paper.startTime
                                            ? new Date(paper.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : `Added ${new Date(paper.createdAt).toLocaleDateString()}`}
                                    </span>
                                    {paper.createdAt && (
                                        <span className="ml-auto px-2 py-0.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-full border border-slate-700">
                                            {new Date(paper.startTime || paper.createdAt).getFullYear()}
                                        </span>
                                    )}
                                </div>
                                {(paper.metadata?.shiftLabel || (paper.startTime && paper.endTime)) && (
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <span className="w-4 h-4 text-slate-500 text-center text-xs">⏰</span>
                                        <span>
                                            {paper.metadata?.shiftLabel && <span className="text-amber-400 font-semibold mr-1">{paper.metadata.shiftLabel}</span>}
                                            {paper.startTime && paper.endTime && (
                                                <span>
                                                    {new Date(paper.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} –{' '}
                                                    {new Date(paper.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                                {paper.metadata?.cenNumber && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className="w-4 h-4 text-center text-xs">📋</span>
                                        <span className="font-mono text-xs">{paper.metadata.cenNumber}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <BookOpen className="w-4 h-4 text-slate-500" />
                                    <span>{paper.questionCount || 0} Questions</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link href={`/admin/exams/${paper.id}`} className="flex-1">
                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700">
                                        <Edit className="w-4 h-4" />
                                        Manage
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredPapers.length === 0 && (
                    <div className="text-center py-16 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
                        <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-300 mb-2">No papers found</h3>
                        <p className="text-slate-500">Publish a PYP from Drafts to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

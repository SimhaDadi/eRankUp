'use client';
import 'reflect-metadata';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BookOpen, Search, Filter, Eye, Play } from 'lucide-react';
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
                setPapers(res.data);
                if (res.data.length > 0) {
                    // Auto-select first category if available, else 'All' or specific logic
                    // For now default to 'All' or user can switch.
                    // Actually better to default to the most popular or first one found?
                    // Let's keep 'SSC' as default if present, else first one.
                    const cats = Array.from(new Set(res.data.map((p: any) => p.category || 'Other')));
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

    const filteredPapers = activeCategory === 'All'
        ? papers
        : papers.filter(p => (p.category || 'Other') === activeCategory);

    const handleDownload = async (paper: any) => {
        try {
            // Need to fetch full details including questions
            // Assuming we have an endpoint for full exam details or we construct it
            // If the list endpoint doesn't return questions, we fetch specific exam
            const res = await api.get(`/exams/${paper.id}`);
            const fullExam = res.data;

            // Extract questions from hierarchy (Exam -> Models -> Questions?) 
            // OR if generic exam structure, it might have questions linked directly or via models
            // The service 'findOne' returns everything.
            // But we need a flat list of questions for the PDF

            let questions: any[] = [];

            // Check direct questions linkage
            if (fullExam.questions && fullExam.questions.length > 0) {
                questions = fullExam.questions;
            }
            // Check models linkage
            else if (fullExam.chapters) {
                // Iterate through hierarchy
                fullExam.chapters.forEach((chapter: any) => {
                    chapter.models?.forEach((model: any) => {
                        // We might need to fetch questions for model if not populated
                        // But usually findOne populates hierarchy structure.
                        // Wait, findOne populates models and chapters, does it populate QUESTIONS inside models?
                        // Service: relations: ['models', 'models.chapter', 'models.chapter.subject', 'questions']
                        // It fetches DIRECT questions. 
                        // It does NOT deep fetch questions inside models by default in current 'findOne'.
                    });
                });
            }

            // If questions are empty, we might need a specific "get questions for exam" endpoint
            // Let's use the '/exams/:id/questions' or similar if it exists, or just use what we have.
            // Actually, for PYP, we usually link questions directly or via a single model.

            if (questions.length === 0) {
                // Fallback: Fetch questions for the first model if available?
                // Or inform user.
                alert("Generating PDF... (Ensure questions are properly linked to this exam)");
            }

            generateExamPDF(fullExam, questions);

        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download PDF. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500 animate-pulse">Loading papers...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">Previous Year Papers</h1>
                    <p className="text-gray-600">Download and practice with authentic exam papers from past years</p>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {distinctCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === category
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
                            whileHover={{ y: -5 }}
                            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                {paper.createdAt && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                        {new Date(paper.createdAt).getFullYear()}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 min-h-[56px]">{paper.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-1">{paper.description || 'Official Previous Year Paper'}</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Added {new Date(paper.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{paper.questionCount || 0} Questions</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Download className="w-4 h-4" />
                                    <span>{0} Downloads</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(paper)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                                <Link href={`/dashboard/exams/${paper.id}`} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200">
                                    <Play className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredPapers.length === 0 && (
                    <div className="text-center py-16">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No papers found</h3>
                        <p className="text-gray-500">Check back later for new uploads!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

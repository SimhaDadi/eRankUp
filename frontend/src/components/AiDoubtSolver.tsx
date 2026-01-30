'use client';

import { useState } from 'react';
import { Camera, Upload, Sparkles, Loader2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AiDoubtSolver({ onClose }: { onClose?: () => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ solution: string; similarQuestions: any[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/ai/photo-search', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to solve question. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/20">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        AI Doubt Solver
                    </h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
                            title="Hide"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {!result && !isUploading && (
                    <div className="relative group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] p-8 text-center group-hover:bg-slate-100 group-hover:border-indigo-400 transition-all duration-300">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">Click to Upload Question</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                Supports PNG, JPG (Max 5MB)
                            </p>
                        </div>
                    </div>
                )}

                {isUploading && (
                    <div className="py-12 text-center space-y-4">
                        <div className="relative w-16 h-16 mx-auto">
                            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-600 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">AI is Analyzing...</h3>
                            <p className="text-xs text-slate-500">Extracting context and solving problem</p>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-2 py-1 rounded-md">Solution</span>
                                    <button onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-sm text-slate-700 leading-relaxed prose prose-slate max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h3: ({ node, ...props }) => <h3 className="text-[10px] font-black mt-4 mb-2 text-indigo-600 uppercase tracking-widest" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-black text-slate-900" {...props} />
                                        }}
                                    >
                                        {result.solution}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {result.similarQuestions?.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Similar Practice Questions <ChevronRight className="w-3 h-3" />
                                    </h4>
                                    <div className="space-y-2">
                                        {result.similarQuestions.map((q: any) => (
                                            <div key={q.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between group hover:bg-white transition-all hover:shadow-sm">
                                                <div className="flex-1 mr-4">
                                                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{q.content}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{q.subject?.title || 'General'}</p>
                                                </div>
                                                <a
                                                    href={`/dashboard/practice?questionId=${q.id}`}
                                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-500 border border-slate-100 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                        <X className="w-4 h-4 bg-red-100 rounded-full p-0.5" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

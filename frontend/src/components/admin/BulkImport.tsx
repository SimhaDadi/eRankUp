'use client';

import { useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileJson, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { parseFile, parseQuestionsFromText } from '@/lib/parser';

interface BulkImportProps {
    modelId: string;
    examId?: string;
    onSuccess: () => void;
    onClose: () => void;
}

export default function BulkImport({ modelId, examId, onSuccess, onClose }: BulkImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any[] | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setPreview(null);
        setStatusMessage('');

        // JSON Handling
        if (selectedFile.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json)) {
                        setPreview(json);
                    } else {
                        setError('JSON must be an array of questions.');
                    }
                } catch (err) {
                    setError('Invalid JSON format.');
                }
            };
            reader.readAsText(selectedFile);
            return;
        }

        // PDF / Image Handling (OCR)
        setIsProcessing(true);
        setStatusMessage('Reading file content (this may take a moment)...');

        try {
            const text = await parseFile(selectedFile);
            setStatusMessage('Parsing questions from text...');
            const parsedQuestions = parseQuestionsFromText(text);

            if (parsedQuestions.length === 0) {
                setError('No questions could be identified. Ensure format is "1. Question... (a) Option..."');
            } else {
                setPreview(parsedQuestions);
            }
        } catch (err: any) {
            console.error(err);
            setError('Failed to process file. ' + (err.message || ''));
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const handleUpload = async () => {
        if (!preview) return;

        setIsUploading(true);
        setError(null);

        try {
            const payload = {
                questions: examId ? preview.map(q => ({
                    ...q,
                    exams: [{ id: examId }]
                })) : preview
            };

            await api.post(`/exams/models/${modelId}/questions/bulk`, payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload questions.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0c111d] border border-slate-800/50 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-600/5 pointer-events-none"></div>

                <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40 backdrop-blur-xl relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                            <Upload className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white leading-none">Bulk Import</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Questions Management</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700/50 group"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                </div>

                <div className="p-10 relative z-10">
                    {!file ? (
                        <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-[2rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-500/[0.02] transition-all group">
                            <input type="file" className="hidden" accept=".json,.pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
                            <div className="flex gap-6 mb-8 group-hover:scale-110 transition-transform">
                                <FileJson className="w-12 h-12 text-slate-600 group-hover:text-cyan-500" />
                                <FileText className="w-12 h-12 text-slate-600 group-hover:text-rose-500" />
                                <ImageIcon className="w-12 h-12 text-slate-600 group-hover:text-amber-500" />
                            </div>
                            <span className="text-xl font-black mb-2 text-white">Upload Documents</span>
                            <span className="text-slate-500 text-sm text-center max-w-xs font-medium leading-relaxed">
                                Suports <b className="text-slate-300">JSON, PDF, PNG, JPG</b>.
                                <br /><span className="text-[10px] opacity-60">Auto-parsing enabled for standard MCQ formats.</span>
                            </span>
                        </label>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-xl">
                                        {file.type === 'application/json' ? <FileJson className="w-6 h-6 text-cyan-500" /> :
                                            file.type === 'application/pdf' ? <FileText className="w-6 h-6 text-rose-500" /> :
                                                <ImageIcon className="w-6 h-6 text-amber-500" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">{file.name}</div>
                                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-0.5">
                                            {(file.size / 1024).toFixed(2)} KB
                                            {preview && ` • ${preview.length} Questions Detected`}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setFile(null); setPreview(null); setError(null); }} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all border border-rose-500/20">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {isProcessing && (
                                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                    <div className="relative">
                                        <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                                        <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse"></div>
                                    </div>
                                    <p className="text-slate-400 font-bold animate-pulse">{statusMessage}</p>
                                </div>
                            )}

                            {preview && (
                                <div className="max-h-64 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                                    {preview.slice(0, 5).map((q, i) => (
                                        <div key={i} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800/50 hover:border-slate-700/50 transition-colors">
                                            <div className="font-bold text-slate-200 mb-3 flex items-start gap-3">
                                                <span className="text-cyan-500 font-black px-2 py-0.5 bg-cyan-500/10 rounded-lg text-xs leading-none">#{i + 1}</span>
                                                <span className="leading-relaxed">{q.content?.substring(0, 100)}...</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {q.options?.map((opt: any) => (
                                                    <div key={opt.id} className={`text-xs px-4 py-2.5 rounded-xl border transition-all ${opt.id === q.correctOptionId
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-black shadow-lg shadow-emerald-500/5'
                                                        : 'bg-slate-950 border-slate-800 text-slate-500 font-medium'}`}>
                                                        <span className="opacity-40 mr-2 uppercase">{opt.id}.</span> {opt.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {preview.length > 5 && (
                                        <div className="text-center py-2">
                                            <span className="px-4 py-1.5 bg-slate-800/50 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest border border-slate-700/50">
                                                + {preview.length - 5} more questions detected
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-4 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl border border-slate-800 font-black text-xs uppercase tracking-widest hover:bg-slate-800/50 hover:text-white transition-all text-slate-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || isProcessing || !preview}
                                    className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading Data...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" /> Import {preview?.length} Questions
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

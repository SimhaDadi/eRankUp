import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileJson, AlertCircle, Download, FileText, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';

interface UploadModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    modelId: string;
    modelTitle: string;
}

export default function UploadModelModal({ isOpen, onClose, onSuccess, modelId, modelTitle }: UploadModelModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [uploadResult, setUploadResult] = useState<{ uploaded: number; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError('');
            setUploadResult(null);
        }
    };

    const handleSubmit = async () => {
        if (!modelId || !file) {
            setError("Please upload a file.");
            return;
        }

        setIsSubmitting(true);
        setError('');
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(`/exams/models/${modelId}/bulk-upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setUploadResult(response.data);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error("Import failed", err);
            setError(err.response?.data?.message || err.message || "Failed to process file.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadTemplate = () => {
        const headers = ['content', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionId', 'explanation', 'topic', 'difficultyWeight', 'positiveMarks', 'negativeMarks'];
        const row = ['What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C', 'Paris is the capital.', 'Geography', '0.5', '2', '0.5'];
        const csvContent = [headers.join(','), row.join(',')].join('\n');

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "questions_template.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-blue-500" /> Upload Questions
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Target Model: <span className="text-blue-400 font-semibold">{modelTitle}</span></p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* File Upload Area */}
                            <div
                                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors ${file ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/50'}`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        const f = e.dataTransfer.files[0];
                                        setFile(f);
                                        setError('');
                                    }
                                }}
                            >
                                {file ? (
                                    <div className="text-center">
                                        <FileJson className="w-10 h-10 text-green-500 mx-auto mb-3" />
                                        <div className="text-green-400 font-bold mb-1">{file.name}</div>
                                        <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</div>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="mt-3 text-xs font-bold text-rose-500 hover:text-rose-400 hover:underline"
                                        >
                                            Remove File
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="flex gap-4 justify-center mb-4">
                                            <FileText className="w-8 h-8 text-slate-600" />
                                            <Image icon={ImageIcon} className="w-8 h-8 text-slate-600" />
                                        </div>
                                        <div className="text-slate-300 font-bold mb-1">Drag file here</div>
                                        <div className="text-xs text-slate-500 mb-4">CSV, PDF, Images (JPG, PNG)</div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold border border-slate-700 transition-colors"
                                        >
                                            Select File
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            hidden
                                            accept=".csv,.pdf,application/vnd.ms-excel,image/jpeg,image/png,image/jpg"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-rose-500" />
                                    <span className="text-sm text-rose-200">{error}</span>
                                </div>
                            )}

                            {uploadResult && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black text-xs font-bold">✓</div>
                                    <span className="text-sm text-emerald-200">{uploadResult.message}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <button onClick={downloadTemplate} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                                    <Download className="w-4 h-4" /> CSV Template
                                </button>
                                <span>AI Processing for PDF/Images</span>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !file}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Importing...' : 'Start Import'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Helper component for Icon
function Image({ icon: Icon, className }: { icon: any, className?: string }) {
    return <Icon className={className} />;
}

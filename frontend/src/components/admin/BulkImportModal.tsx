import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileJson, AlertCircle, CheckCircle, Download } from 'lucide-react';
import api from '@/lib/api';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived state for dependent dropdowns
    const chapters = selectedExam ? exams.find(e => e.id === selectedExam)?.chapters || [] : [];
    const models = selectedChapter ? chapters.find((c: any) => c.id === selectedChapter)?.models || [] : [];

    useEffect(() => {
        if (isOpen) {
            fetchExams();
            setError('');
            setFile(null);
        }
    }, [isOpen]);

    const fetchExams = async () => {
        try {
            const response = await api.get('/exams');
            setExams(response.data);
        } catch (error) {
            console.error("Failed to fetch hierarchy", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError('');
        }
    };

    const downloadTemplate = () => {
        const template = [
            {
                "content": "What is the capital of France?",
                "options": ["London", "Berlin", "Paris", "Madrid"],
                "correctOptionIndex": 2,
                "difficultyWeight": 0.3,
                "positiveMarks": 2,
                "negativeMarks": 0.5,
                "explanation": "Paris is the capital of France."
            }
        ];
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "questions_template.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSubmit = async () => {
        if (!selectedModel || !file) {
            setError("Please select a target Model and upload a file.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            let questions = [];

            if (file.type === "application/json") {
                const text = await file.text();
                questions = JSON.parse(text);
            } else {
                // AI Import Path for PDF/Images
                const formData = new FormData();
                formData.append('file', file);

                // Show intermediate status
                const aiResponse = await api.post('/ai/parse-document', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                questions = aiResponse.data;
            }

            if (!Array.isArray(questions)) {
                throw new Error("Parsed data is not an array. Please check the file.");
            }

            // Basic validation
            for (const q of questions) {
                if (!q.content || !q.options || q.options.length < 2) {
                    throw new Error("Invalid question format detected.");
                }
            }

            const payload = { questions };
            await api.post(`/exams/models/${selectedModel}/questions/bulk`, payload);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Import failed", err);
            setError(err.message || "Failed to process file.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#0f172a] border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-500" /> Bulk Import Questions
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Hierarchy Selection */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        value={selectedExam}
                                        onChange={e => setSelectedExam(e.target.value)}
                                    >
                                        <option value="">Select Exam</option>
                                        {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chapter</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        disabled={!selectedExam}
                                        value={selectedChapter}
                                        onChange={e => setSelectedChapter(e.target.value)}
                                    >
                                        <option value="">Select Chapter</option>
                                        {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Model</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        disabled={!selectedChapter}
                                        value={selectedModel}
                                        onChange={e => setSelectedModel(e.target.value)}
                                    >
                                        <option value="">Select Model</option>
                                        {models.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* File Upload Area */}
                            <div
                                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors ${file ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/50'}`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        const f = e.dataTransfer.files[0];
                                        if (f.type === "application/json" || f.type.startsWith("image/") || f.type === "application/pdf") {
                                            setFile(f);
                                            setError('');
                                        } else {
                                            setError("Supported formats: JSON, PDF, Images (PNG/JPG)");
                                        }
                                    }
                                }}
                            >
                                {file ? (
                                    <div className="text-center">
                                        <FileJson className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                        <div className="text-green-400 font-bold mb-2">{file.name}</div>
                                        <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</div>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="mt-4 text-xs font-bold text-rose-500 hover:text-rose-400 hover:underline"
                                        >
                                            Remove File
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                        <div className="text-slate-300 font-bold mb-1">Drag file here</div>
                                        <div className="text-xs text-slate-500 mb-6">Support: JSON, PDF, Images</div>
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
                                            accept=".json,.pdf,image/*"
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

                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <button onClick={downloadTemplate} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                                    <Download className="w-4 h-4" /> Download JSON Template
                                </button>
                                <span>Advanced: AI Import for PDF/Images</span>
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
                                disabled={isSubmitting || !file || !selectedModel}
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

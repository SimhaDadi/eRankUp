import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X, FileText, Upload, Eye } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import api from '@/lib/api';

export default function BulkUploadTab() {
    const [loading, setLoading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/questions/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                alert(response.data.message);
            } else {
                setError(response.data.message || 'Upload failed with warnings');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to upload questions';
            setError(message);
            console.error('Error uploading questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrProcessing(true);
        setExtractedText('');
        setError(null);

        try {
            if (file.type === 'application/pdf') {
                setError('PDF OCR processing will be implemented with backend support');
            } else if (file.type.startsWith('image/')) {
                const worker = await createWorker('eng');
                const { data: { text } } = await worker.recognize(file);
                await worker.terminate();

                setExtractedText(text);
            }
        } catch (error: any) {
            setError('Failed to extract text from file');
            console.error('OCR Error:', error);
        } finally {
            setOcrProcessing(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* CSV/Excel Upload */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                    <FileText className="w-12 h-12 mb-4 text-blue-400" />
                    <h3 className="text-xl font-bold text-white mb-2">CSV / Excel Upload</h3>
                    <p className="text-sm text-slate-400 mb-4">Structured data format (recommended)</p>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleBulkUpload}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Upload CSV or Excel file"
                        />
                        <button
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Choose CSV/Excel (v2)
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* PDF/Image Upload with OCR */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                    <Eye className="w-12 h-12 mb-4 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white mb-2">PDF / Image Upload</h3>
                    <p className="text-sm text-slate-400 mb-4">OCR text extraction (AI-powered)</p>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleOCRUpload}
                            disabled={ocrProcessing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Upload PDF or image file for OCR"
                        />
                        <button
                            disabled={ocrProcessing}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            {ocrProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Choose PDF/Image
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* OCR Processing Status */}
            {ocrProcessing && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-semibold text-blue-400">Processing with OCR...</span>
                    </div>
                </div>
            )}

            {/* Extracted Text Preview */}
            {extractedText && (
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6">
                    <h4 className="font-bold text-white mb-4">Extracted Text Preview</h4>
                    <div className="bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap">{extractedText}</pre>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

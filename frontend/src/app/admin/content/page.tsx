'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    Download,
    FileText,
    AlertCircle,
    CheckCircle,
    X,
    Copy,
    Image as ImageIcon,
    Trash2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';

export default function ContentPage() {
    const [activeTab, setActiveTab] = useState<'import' | 'duplicates' | 'media'>('import');

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Content Management
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Manage questions, check for duplicates, and simple media library
                </p>
            </header>

            <div className="flex gap-1 bg-slate-900/40 p-1 rounded-xl w-fit border border-slate-800/50">
                <TabButton active={activeTab === 'import'} onClick={() => setActiveTab('import')} label="Import / Export" icon={FileText} />
                <TabButton active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')} label="Duplicate Check" icon={Copy} />
                <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')} label="Media Library" icon={ImageIcon} />
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'import' && <ImportExportTab key="import" />}
                {activeTab === 'duplicates' && <DuplicateCheckTab key="duplicates" />}
                {activeTab === 'media' && <MediaLibraryTab key="media" />}
            </AnimatePresence>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

function ImportExportTab() {
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadResult, setUploadResult] = useState<any>(null);

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadStatus('uploading');
        try {
            const res = await api.post('/admin/content/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadResult(res.data);
            setUploadStatus('success');
        } catch (error: any) {
            setUploadStatus('error');
            setUploadResult({ errors: [error.message || 'Upload failed'] });
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1
    });

    const handleDownload = async () => {
        try {
            const res = await api.get('/admin/content/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `questions_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Failed to download questions');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Import Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-400" />
                        Bulk Import
                    </h2>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-slate-300 font-medium mb-1">
                            {isDragActive ? "Drop CSV here..." : "Drag & drop CSV file"}
                        </p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                    </div>

                    <div className="mt-4 flex justify-between items-center text-sm">
                        <a href="#" className="text-blue-400 hover:text-blue-300 hover:underline">Download Template</a>
                        <span className="text-slate-600">Max 5MB</span>
                    </div>

                    {uploadStatus !== 'idle' && (
                        <div className={`mt-6 p-4 rounded-xl border ${uploadStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                uploadStatus === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800 border-slate-700'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {uploadStatus === 'uploading' && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                                {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                <span className="font-bold text-white">
                                    {uploadStatus === 'uploading' ? 'Importing questions...' :
                                        uploadStatus === 'success' ? 'Import Successful!' : 'Import Failed'}
                                </span>
                            </div>

                            {uploadResult && (
                                <div className="text-sm space-y-1">
                                    {uploadResult.importedCount !== undefined && (
                                        <p className="text-emerald-400">Successfully imported {uploadResult.importedCount} questions.</p>
                                    )}
                                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                                        <div className="mt-2 p-2 bg-black/20 rounded max-h-32 overflow-y-auto">
                                            <p className="text-red-400 font-bold mb-1">Errors:</p>
                                            {uploadResult.errors.map((err: string, i: number) => (
                                                <div key={i} className="text-red-300 text-xs">{err}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Export Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl h-fit">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-purple-400" />
                        Export Data
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Download all questions in the database as a CSV file. Useful for backups or bulk editing.
                    </p>
                    <button
                        onClick={handleDownload}
                        className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download All Questions
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function DuplicateCheckTab() {
    const [text, setText] = useState('');
    const [result, setResult] = useState<any>(null);
    const [checking, setChecking] = useState(false);

    const handleCheck = async () => {
        if (!text.trim()) return;
        setChecking(true);
        try {
            // Split by newlines to get questions
            const questions = text.split(/\n/).filter(line => line.trim().length > 0);
            const res = await api.post('/admin/content/duplicates', { questions });
            setResult(res.data);
        } catch (error) {
            alert('Failed to check duplicates');
        } finally {
            setChecking(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <h2 className="text-xl font-bold text-white mb-4">Paste Content to Check</h2>
                <p className="text-sm text-slate-400 mb-4">Paste question texts (one per line) to check if they already exist in the database.</p>
                <textarea
                    className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 resize-none text-sm font-mono"
                    placeholder="Paste questions here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                ></textarea>
                <button
                    onClick={handleCheck}
                    disabled={checking || !text.trim()}
                    className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                    {checking ? 'Checking...' : 'Check for Duplicates'}
                </button>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <h2 className="text-xl font-bold text-white mb-4">Results</h2>
                {result ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                            <div>
                                <div className="text-sm text-slate-400">Total Checked</div>
                                <div className="text-2xl font-bold text-white">{result.totalChecked}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">Duplicates Found</div>
                                <div className={`text-2xl font-bold ${result.duplicatesFound > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {result.duplicatesFound}
                                </div>
                            </div>
                        </div>

                        {result.duplicates.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {result.duplicates.map((dup: any, i: number) => (
                                    <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <div className="text-xs text-red-300 font-bold mb-1">Potential Duplicate</div>
                                        <div className="text-sm text-white">{dup.content}</div>
                                        <div className="text-xs text-slate-500 mt-2">Matches ID: {dup.existingId}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-emerald-400">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="font-bold">No duplicates found</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                        Results will appear here
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function MediaLibraryTab() {
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/media');
            setMedia(res.data);
        } catch (error) {
            console.error('Failed to fetch media');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/admin/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchMedia();
        } catch (error) {
            alert('Upload failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this file?')) return;
        try {
            await api.delete(`/admin/media/${id}`);
            fetchMedia();
        } catch (error) {
            alert('Delete failed');
        }
    };

    useState(() => {
        fetchMedia();
    });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50">
                <div>
                    <h2 className="text-xl font-bold text-white">Media Library</h2>
                    <p className="text-sm text-slate-400">Manage uploaded images and assets</p>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload New
                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {loading ? (
                    [...Array(5)].map((_, i) => <div key={i} className="aspect-square bg-slate-900/40 rounded-xl animate-pulse"></div>)
                ) : media.length > 0 ? (
                    media.map((item) => (
                        <div key={item.id} className="group relative aspect-square bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                <ImageIcon className="w-8 h-8 opacity-20" />
                            </div>
                            {/* In real app, simpler 'img' tag with item.url */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-xs text-white font-medium truncate">{item.filename}</p>
                                <div className="flex justify-end mt-2 gap-2">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-slate-500">
                        No media files found.
                    </div>
                )}
            </div>
        </motion.div>
    );
}

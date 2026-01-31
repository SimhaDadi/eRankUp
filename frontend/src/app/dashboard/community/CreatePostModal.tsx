'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Send } from 'lucide-react';
import api from '@/lib/api';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post('/community/posts', { content, category });
            setContent('');
            onPostCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create post', error);
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
                        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Create Post</h3>
                            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind? Ask a doubt or share a tip..."
                                rows={5}
                                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none resize-none text-gray-700 placeholder:text-gray-400 font-medium"
                                autoFocus
                            />

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="bg-gray-100 text-xs font-bold text-gray-600 px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                                    >
                                        <option value="General">General</option>
                                        <option value="Doubt">Doubt</option>
                                        <option value="Strategy">Strategy</option>
                                        <option value="Motivation">Motivation</option>
                                    </select>
                                    <button type="button" className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!content.trim() || isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    {isSubmitting ? 'Posting...' : (
                                        <>
                                            Post <Send className="w-3.5 h-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

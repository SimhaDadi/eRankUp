'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { fullName: string };
}

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    onCommentAdded: () => void;
}

export default function CommentModal({ isOpen, onClose, postId, onCommentAdded }: CommentModalProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/community/posts/${postId}/comments`);
            setComments(res.data);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
        }
    }, [isOpen, postId, fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await api.post(`/community/posts/${postId}/comments`, { content: newComment });
            setNewComment('');
            setComments(prev => [...prev, res.data]);
            onCommentAdded();
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-slate-800 tracking-tight">Discussion</h3>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/3" />
                                                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-bold">No comments yet.</p>
                                    <p className="text-slate-400 text-sm">Be the first to share your thoughts!</p>
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                                            {comment.user.fullName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-slate-900 text-sm">{comment.user.fullName}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {formatDistanceToNow(new Date(comment.createdAt))} ago
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100/50 group-hover:border-blue-100 transition-colors">
                                                <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <form onSubmit={handleSubmit} className="relative">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a supportive comment..."
                                    rows={1}
                                    className="w-full pl-5 pr-14 py-4 bg-white rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none resize-none text-slate-700 font-medium placeholder:text-slate-400 text-sm shadow-sm transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="mt-3 text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">
                                press enter to post
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

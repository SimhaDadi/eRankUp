'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Share2, MoreHorizontal, Plus, Search, Filter } from 'lucide-react';
import api from '@/lib/api';
import CreatePostModal from './CreatePostModal';
import CommentModal from './CommentModal';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Post {
    id: string;
    content: string;
    user: { fullName: string; role: string };
    category: string;
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    createdAt: string;
}

export default function CommunityPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [category, setCategory] = useState('All');

    useEffect(() => {
        fetchPosts();
    }, [category]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/community/feed', {
                params: { category: category === 'All' ? undefined : category }
            });
            setPosts(res.data);
        } catch (error) {
            console.error('Failed to fetch feed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (postId: string) => {
        // Optimistic update
        setPosts(current => current.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    isLiked: !p.isLiked,
                    likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
                };
            }
            return p;
        }));

        try {
            await api.post(`/community/posts/${postId}/like`);
        } catch (error) {
            console.error('Like failed');
            // Revert on failure
            setPosts(current => current.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        isLiked: !p.isLiked,
                        likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
                    };
                }
                return p;
            }));
        }
    };

    const handleCommentOpen = (postId: string) => {
        setSelectedPostId(postId);
        setIsCommentModalOpen(true);
    };

    const handleShare = (post: Post) => {
        const shareUrl = `${window.location.origin}/dashboard/community?post=${post.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            toast.success('Share link copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy link');
        });
    };

    const categories = ['All', 'General', 'Doubt', 'Strategy', 'Motivation'];

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Community</h1>
                    <p className="text-slate-500 font-medium">Discuss, share doubts, and grow together.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Start Discussion
                </button>
            </div>

            <div className="flex gap-4 items-start">
                {/* Main Feed */}
                <div className="flex-1 space-y-6">
                    {/* Filters */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${category === cat
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white h-48 rounded-3xl animate-pulse shadow-sm border border-slate-100" />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm text-center space-y-4"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100 mb-2">
                                <MessageSquare className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">No discussions here yet</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                Be the first to start a conversation in the <span className="text-blue-600 font-bold">{category}</span> category!
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                            >
                                <Plus className="w-5 h-5" /> Start Discussion
                            </button>
                        </motion.div>
                    ) : (
                        posts.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/60 hover:border-blue-100 transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {post.user.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 leading-none">{post.user.fullName}</div>
                                            <div className="text-xs text-slate-400 font-medium mt-1">
                                                {formatDistanceToNow(new Date(post.createdAt))} ago • <span className="text-blue-500">{post.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap font-medium">
                                    {post.content}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex gap-6">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className={`flex items-center gap-2 text-sm font-bold transition-colors ${post.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                                        >
                                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                            {post.likesCount}
                                        </button>
                                        <button 
                                            onClick={() => handleCommentOpen(post.id)}
                                            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                            {post.commentsCount}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleShare(post)}
                                        className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-xl"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Right Sidebar (Desktop) */}
                <div className="hidden lg:block w-80 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
                        <h3 className="font-black text-slate-800 mb-4">Trending Topics</h3>
                        <div className="space-y-3">
                            {['#SSC_CGL', '#Maths_Doubt', '#Exam_Strategy', '#Motivation'].map(tag => (
                                <div key={tag} className="flex items-center justify-between text-sm group cursor-pointer">
                                    <span className="font-bold text-slate-500 group-hover:text-blue-600 transition-colors">{tag}</span>
                                    <span className="text-xs text-slate-400">2.4k posts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPostCreated={fetchPosts}
            />

            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                postId={selectedPostId || ''}
                onCommentAdded={fetchPosts}
            />
        </div>
    );
}

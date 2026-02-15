'use client';

import { useState, useEffect } from 'react';
import { Trash2, MessageSquare, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Post {
    id: string;
    content: string;
    user: { fullName: string; email: string };
    category: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
}

export default function AdminCommunityPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/community/feed?limit=50');
            setPosts(res.data);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setIsLoading(false);
        }
    };

    const deletePost = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/community/posts/${id}`); // Assuming delete endpoint exists, might need backend update
            setPosts(posts.filter(p => p.id !== id));
        } catch (error) {
            alert('Failed to delete post (Endpoint might typically be restricted)');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-white">Community Moderation</h1>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Author</th>
                            <th className="px-6 py-4">Content</th>
                            <th className="px-6 py-4">Stats</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-500">Loading...</td></tr>
                        ) : posts.map((post) => (
                            <tr key={post.id} className="hover:bg-slate-800/50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">{post.user.fullName}</div>
                                    <div className="text-xs text-slate-500">{post.user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-300 line-clamp-2 max-w-md">{post.content}</div>
                                    <div className="text-xs text-slate-500 mt-1">{post.category} • {formatDistanceToNow(new Date(post.createdAt))} ago</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                    {post.likesCount} Likes<br />
                                    {post.commentsCount} Comments
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => deletePost(post.id)}
                                        className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

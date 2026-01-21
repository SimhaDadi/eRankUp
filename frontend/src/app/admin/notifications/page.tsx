'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    Send,
    LayoutTemplate,
    Plus,
    Trash2,
    Users,
    CheckCircle
} from 'lucide-react';
import api from '@/lib/api';

interface Template {
    id: string;
    name: string;
    title: string;
    body: string;
    type: 'general' | 'promotion' | 'alert';
}

export default function NotificationsPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'send' | 'templates'>('send');

    // Send Form State
    const [message, setMessage] = useState({
        title: '',
        body: '',
        recipients: 'ALL'
    });
    const [sending, setSending] = useState(false);

    // Template Form State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        title: '',
        body: '',
        type: 'general'
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/notifications/templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/admin/notifications/send', message);
            alert('Notification sent successfully!');
            setMessage({ title: '', body: '', recipients: 'ALL' });
        } catch (error) {
            alert('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/notifications/templates', newTemplate);
            setShowTemplateModal(false);
            setNewTemplate({ name: '', title: '', body: '', type: 'general' });
            fetchTemplates();
        } catch (error) {
            alert('Failed to create template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        try {
            await api.delete(`/admin/notifications/templates/${id}`);
            fetchTemplates();
        } catch (error) {
            alert('Failed to delete template');
        }
    };

    const loadTemplate = (template: Template) => {
        setMessage({
            ...message,
            title: template.title,
            body: template.body
        });
        setActiveTab('send');
    };

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Notifications
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Send updates, announcements, and alerts to users
                </p>
            </header>

            <div className="flex gap-4 border-b border-slate-800 pb-1">
                <button
                    onClick={() => setActiveTab('send')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'send' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                >
                    Send Notification
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'templates' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                >
                    Manage Templates
                </button>
            </div>

            {activeTab === 'send' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-3xl"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Send className="w-5 h-5 text-blue-400" />
                                Compose Message
                            </h2>

                            <form onSubmit={handleSend} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Subject / Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
                                        placeholder="e.g., New Exam Available: SSC CGL Tier 1"
                                        value={message.title}
                                        onChange={e => setMessage({ ...message, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Message Body</label>
                                    <textarea
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700 h-40 resize-none"
                                        placeholder="Write your notification content here..."
                                        value={message.body}
                                        onChange={e => setMessage({ ...message, body: e.target.value })}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Recipients</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${message.recipients === 'ALL' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                                            <input
                                                type="radio"
                                                name="recipients"
                                                value="ALL"
                                                checked={message.recipients === 'ALL'}
                                                onChange={() => setMessage({ ...message, recipients: 'ALL' })}
                                                className="hidden"
                                            />
                                            <div className="flex items-center gap-3">
                                                <Users className="w-5 h-5" />
                                                <span className="font-bold">All Users</span>
                                            </div>
                                        </label>
                                        {/* Future: Add more segments here */}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {sending ? 'Sending...' : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Send Broadcast
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4" />
                                Quick Templates
                            </h3>
                            <div className="space-y-3">
                                {templates.slice(0, 5).map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => loadTemplate(template)}
                                        className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group"
                                    >
                                        <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{template.name}</div>
                                        <div className="text-xs text-slate-500 truncate mt-1">{template.title}</div>
                                    </button>
                                ))}
                                {templates.length === 0 && (
                                    <p className="text-sm text-slate-600 italic">No templates saved.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'templates' && (
                <div>
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors border border-slate-700"
                        >
                            <Plus className="w-5 h-5" />
                            New Template
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(template => (
                            <motion.div
                                key={template.id}
                                layout
                                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl relative group"
                            >
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase mb-3 ${template.type === 'promotion' ? 'bg-purple-500/10 text-purple-400' :
                                        template.type === 'alert' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {template.type}
                                </span>

                                <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                                <p className="text-sm text-slate-400 font-medium mb-4">{template.title}</p>

                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                        {template.body}
                                    </p>
                                </div>

                                <button
                                    onClick={() => loadTemplate(template)}
                                    className="w-full mt-4 py-2 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-400 font-bold text-sm transition-all"
                                >
                                    Use Template
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {showTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0c111d] border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-xl font-bold text-white mb-6">Create Notification Template</h2>
                        <form onSubmit={handleCreateTemplate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g., Weekly Reminder"
                                    value={newTemplate.name}
                                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    value={newTemplate.type}
                                    onChange={e => setNewTemplate({ ...newTemplate, type: e.target.value as any })}
                                >
                                    <option value="general">General Update</option>
                                    <option value="promotion">Promotion / Sale</option>
                                    <option value="alert">Alert / Warning</option>
                                </select>
                            </div>

                            <div className="border-t border-slate-800 pt-4 mt-4">
                                <label className="block text-sm font-medium text-slate-400 mb-1">Default Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    value={newTemplate.title}
                                    onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Default Body</label>
                                <textarea
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
                                    value={newTemplate.body}
                                    onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                                >
                                    Save Template
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

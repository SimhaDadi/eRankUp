'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, MessageSquare, History, Trash2, Menu } from 'lucide-react';
import api from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    image?: string; // Base64 or URL for display
}

const SUGGESTED_PROMPTS = [
    'Explain Time and Work concepts for SSC CGL',
    'Give me 5 Reasoning questions for RRB NTPC',
    'Important Current Affairs for SSC CHSL',
    'Explain Newton\'s Laws for Railway Group D',
    'Create a 30-day study plan for SSC CGL',
    'Shortcut tricks for Profit and Loss',
];

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

const useTypewriter = (text: string, speed: number = 20) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        setDisplayedText('');
        setIsComplete(false);
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayedText, isComplete };
};

const TypewriterMessage = ({ content }: { content: string }) => {
    const { displayedText, isComplete } = useTypewriter(content);
    return (
        <div className="whitespace-pre-wrap leading-relaxed relative z-10 font-medium">
            {displayedText}
            {!isComplete && <span className="animate-pulse">|</span>}
        </div>
    );
};

export default function AIChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/ai-chat/conversations');
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        }
    };

    const loadConversation = async (id: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/ai-chat/conversation/${id}`);
            setMessages(response.data.map((m: any) => ({
                role: m.role,
                content: m.content,
                image: m.image,
                animate: false // Never animate history
            })));
            setConversationId(id);
            if (window.innerWidth < 768) setSidebarOpen(false);
        } catch (error) {
            console.error('Failed to load conversation', error);
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        setMessages([]);
        setConversationId(null);
        setSelectedImage(null);
        setInput('');
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    const deleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;
        try {
            await api.delete(`/ai-chat/conversation/${id}`);
            if (conversationId === id) startNewChat();
            fetchConversations();
        } catch (error) {
            console.error('Failed to delete conversation', error);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage({
                    file,
                    preview: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const convertToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve({
                    data: base64String,
                    mimeType: file.type
                });
            };
            reader.onerror = error => reject(error);
        });
    };

    const sendMessage = async () => {
        if ((!input.trim() && !selectedImage) || loading) return;

        const userMessage = input.trim();
        const currentImage = selectedImage;

        setInput('');
        setSelectedImage(null);

        // Optimistically add user message
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            image: currentImage?.preview,
            animate: false
        }]);
        setLoading(true);

        try {
            let imageData = undefined;
            if (currentImage) {
                imageData = await convertToBase64(currentImage.file);
            }

            const response = await api.post('/ai-chat/message', {
                conversationId,
                message: userMessage || (currentImage ? "Analyze this image" : ""),
                image: imageData,
            });

            setConversationId(response.data.conversationId);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.response,
                animate: true // Animate only this new response
            }]);
            fetchConversations(); // Refresh sidebar title if new
        } catch (error) {
            console.error('Failed to send message', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.',
                    animate: false
                },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleUseSuggestion = (suggestion: string) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-inter overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {sidebarOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        className="w-72 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col shrink-0 z-50 fixed md:relative h-full"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="font-black text-xs uppercase tracking-widest text-purple-400">History</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            <button
                                onClick={startNewChat}
                                className="w-full flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-purple-500/10 active:scale-95"
                            >
                                <Plus size={18} />
                                New Chat
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-4 scrollbar-thin scrollbar-thumb-slate-800">
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${conversationId === conv.id
                                        ? 'bg-white/10 border border-white/10 shadow-lg'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <MessageSquare size={16} className={conversationId === conv.id ? 'text-purple-400' : 'text-slate-500'} />
                                    <span className="flex-1 text-sm font-medium truncate">
                                        {conv.title || 'New Conversation'}
                                    </span>
                                    <button
                                        onClick={(e) => deleteConversation(e, conv.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {conversations.length === 0 && (
                                <div className="text-center py-10 px-4">
                                    <History size={32} className="mx-auto mb-3 text-slate-700" />
                                    <p className="text-xs text-slate-500 font-medium">No recent chats yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Header */}
                <div className="bg-slate-900/80 backdrop-blur-md p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className={`p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-all ${sidebarOpen ? 'hidden md:hidden' : ''}`}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="text-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-10 h-10 rounded-xl flex items-center justify-center border border-white/10">
                                🤖
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white tracking-tight">Tutor</h1>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Efficiency Mode</span>
                            <span className="text-[9px] text-slate-500">v1.2.0-beta</span>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mt-12"
                            >
                                <div className="text-6xl mb-6">👋</div>
                                <h2 className="text-3xl font-bold text-white mb-3">
                                    Hi! I'm your Study Companion
                                </h2>
                                <p className="text-slate-300 mb-8">
                                    I can help you understand concepts, practice questions, and create study plans
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                                    {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                                        <motion.button
                                            key={suggestion}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            onClick={() => handleUseSuggestion(suggestion)}
                                            className="bg-slate-800/40 hover:bg-slate-800/80 backdrop-blur-md border border-white/10 hover:border-purple-500/50 text-white p-5 rounded-3xl text-left transition-all group shadow-xl"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <span className="text-xl">💡</span>
                                                </div>
                                                <span className="text-sm font-semibold leading-snug">{suggestion}</span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group ${msg.role === 'user'
                                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white'
                                            : 'bg-slate-800/90 text-slate-100 border border-white/10'
                                            }`}
                                    >
                                        {msg.role === 'user' && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                        )}
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mb-3 text-purple-400 text-xs font-black uppercase tracking-widest">
                                                <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                                    <span>🤖</span>
                                                </div>
                                                <span>Tutor</span>
                                            </div>
                                        )}

                                        {msg.image && (
                                            <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                                <img src={msg.image} alt="Uploaded attachment" className="max-w-full h-auto max-h-[300px] object-contain bg-black/20" />
                                            </div>
                                        )}

                                        {/* TYPEWRITED CONTENT FOR ASSISTANT, PLAIN FOR USER */}
                                        {msg.role === 'assistant' && msg.animate ? (
                                            <TypewriterMessage content={msg.content} />
                                        ) : (
                                            <div className="whitespace-pre-wrap leading-relaxed relative z-10 font-medium">{msg.content}</div>
                                        )}

                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-slate-800/90 border border-white/10 p-5 rounded-[2rem]">
                                    <div className="flex items-center gap-2 mb-3 text-purple-400 text-xs font-black uppercase tracking-widest">
                                        <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                            <span>🤖</span>
                                        </div>
                                        <span>Tutor</span>
                                    </div>
                                    <div className="flex gap-1.5 ml-1">
                                        {[0, 0.2, 0.4].map((delay, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -6, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay }}
                                                className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-white/5 bg-slate-900/50 backdrop-blur-3xl p-4 md:p-6 shrink-0">
                    <div className="max-w-4xl mx-auto">
                        {/* Image Preview */}
                        <AnimatePresence>
                            {selectedImage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="mb-4 relative inline-block group"
                                >
                                    <div className="p-1 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-xl shadow-purple-500/20">
                                        <div className="relative rounded-xl overflow-hidden border border-white/20 bg-slate-800">
                                            <img src={selectedImage.preview} alt="Preview" className="h-24 w-24 object-cover" />
                                            <button
                                                onClick={() => setSelectedImage(null)}
                                                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-4 items-end">
                            <div className="flex-1 relative">
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div className="flex gap-2">
                                    {/* The User requested "+" button for images */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="shrink-0 w-[52px] h-[52px] md:w-[58px] md:h-[58px] rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-400 hover:text-purple-400 flex items-center justify-center transition-all group"
                                        title="Add image"
                                    >
                                        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
                                    </button>

                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress as any}
                                        placeholder="Ask anything about your syllabus..."
                                        rows={1}
                                        className="flex-1 bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-[16px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 disabled:opacity-50 transition-all resize-none min-h-[52px] md:min-h-[58px] max-h-[150px]"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={sendMessage}
                                disabled={loading || (!input.trim() && !selectedImage)}
                                className="shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-800 disabled:to-slate-800 text-white w-[80px] md:w-[120px] h-[52px] md:h-[58px] rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-purple-500/30 active:scale-95 disabled:shadow-none flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Send'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, MessageSquare, History, Trash2, Menu, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    image?: string; // Base64 or URL for display
    animate?: boolean;
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
            alert('Conversation deleted');
        } catch (error) {
            console.error('Failed to delete conversation', error);
            alert('Failed to delete conversation');
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
        <div className="flex h-screen bg-slate-50 text-slate-900 font-inter overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {sidebarOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0 z-50 fixed md:relative h-full"
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#00bfa5]">History</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden text-slate-400 hover:text-slate-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            <button
                                onClick={startNewChat}
                                className="w-full flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                            >
                                <Plus size={18} />
                                New Chat
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-4 scrollbar-thin scrollbar-thumb-slate-200">
                            {conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${conversationId === conv.id
                                        ? 'bg-slate-100 border border-slate-200 shadow-sm'
                                        : 'hover:bg-slate-50 border border-transparent'
                                        }`}
                                >
                                    <MessageSquare size={16} className={conversationId === conv.id ? 'text-[#00bfa5]' : 'text-slate-400'} />
                                    <span className="flex-1 text-sm font-bold text-slate-700 truncate">
                                        {conv.title || 'New Conversation'}
                                    </span>
                                    <button
                                        onClick={(e) => deleteConversation(e, conv.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {conversations.length === 0 && (
                                <div className="text-center py-10 px-4">
                                    <History size={32} className="mx-auto mb-3 text-slate-200" />
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No recent chats yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className={`p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all ${sidebarOpen ? 'hidden md:hidden' : ''}`}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-[#00bfa5]/10 to-cyan-500/10 w-10 h-10 rounded-xl flex items-center justify-center border border-[#00bfa5]/20 shadow-sm">
                                <span className="text-xl">🤖</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">eRankUp Tutor</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 bg-[#00bfa5] rounded-full animate-pulse shadow-[0_0_8px_#00bfa5]"></div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">AI Specialist Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-[9px] font-black text-[#00bfa5] uppercase tracking-[0.2em]">Efficiency Mode</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">v1.2.0-beta</span>
                        </div>
                        <Link
                            href="/dashboard"
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
                            title="Close Tutor"
                        >
                            <X size={20} />
                        </Link>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mt-6 md:mt-10"
                            >
                                <div className="text-5xl mb-4 drop-shadow-lg">👋</div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
                                    Your Study Companion
                                </h2>
                                <p className="text-slate-500 font-bold mb-6 max-w-lg mx-auto leading-relaxed text-sm md:text-base">
                                    Instant doubts solving and curriculum coaching tailored perfectly for your preparation path.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto px-4">
                                    {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                                        <motion.button
                                            key={suggestion}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => handleUseSuggestion(suggestion)}
                                            className="bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-[#00bfa5]/40 text-slate-900 p-4 rounded-3xl text-left transition-all group shadow-sm hover:shadow-md ring-1 ring-slate-900/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-[#00bfa5]/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                                    <Sparkles className="w-4 h-4 text-[#00bfa5]" />
                                                </div>
                                                <span className="text-xs md:text-sm font-bold leading-snug text-slate-700">{suggestion}</span>
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
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-5 rounded-[2rem] relative overflow-hidden group transition-all duration-300 ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-[#00bfa5] to-cyan-600 text-white shadow-xl shadow-[#00bfa5]/10 font-bold'
                                            : 'bg-white text-slate-700 border border-slate-200/60 shadow-lg shadow-slate-200/20'
                                            }`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mb-2 text-[#00bfa5] text-xs font-black uppercase tracking-[0.2em] border-b border-[#00bfa5]/10 pb-2">
                                                <div className="w-6 h-6 bg-[#00bfa5] rounded-lg flex items-center justify-center shadow-lg shadow-[#00bfa5]/20">
                                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <span>Tutor Solution</span>
                                            </div>
                                        )}

                                        {msg.image && (
                                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-sm">
                                                <Image
                                                    src={msg.image}
                                                    alt="Uploaded attachment"
                                                    width={300}
                                                    height={300}
                                                    className="w-full h-auto object-contain bg-slate-50"
                                                    unoptimized
                                                />
                                            </div>
                                        )}

                                        {/* RENDER ASSISTANT WITH MARKDOWN, USER WITH PLAIN TEXT (BUT STYLED) */}
                                        {msg.role === 'assistant' ? (
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-slate max-w-none prose-p:leading-snug prose-li:leading-snug prose-h3:mt-3 prose-h3:mb-1">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        h3: ({ node, ...props }) => <h3 className="text-xs font-black mt-3 mb-1 text-[#00bfa5] uppercase tracking-wider" {...props} />,
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2 space-y-0.5" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2 space-y-0.5" {...props} />,
                                                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                        code: ({ node, ...props }) => <code className="bg-slate-100 px-1 rounded font-mono text-xs" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-black text-slate-900" {...props} />
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="text-sm whitespace-pre-wrap leading-relaxed relative z-10 font-bold">{msg.content}</div>
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
                                <div className="bg-white border border-slate-200/60 p-5 rounded-[2rem] shadow-lg shadow-slate-200/20">
                                    <div className="flex items-center gap-2 mb-3 text-[#00bfa5] text-[10px] font-black uppercase tracking-[0.2em]">
                                        <div className="w-6 h-6 bg-[#00bfa5]/10 rounded-lg flex items-center justify-center">
                                            <span className="text-xs">🤖</span>
                                        </div>
                                        <span>Analyzing context</span>
                                    </div>
                                    <div className="flex gap-1.5 ml-1">
                                        {[0, 0.2, 0.4].map((delay, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay }}
                                                className="w-1.5 h-1.5 bg-[#00bfa5] rounded-full shadow-[0_0_8px_rgba(0,191,165,0.4)]"
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
                <div className="border-t border-slate-200 bg-white p-4 md:p-5 shrink-0 relative z-20">
                    <div className="max-w-4xl mx-auto">
                        {/* Image Preview */}
                        <AnimatePresence>
                            {selectedImage && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="mb-4 relative inline-block group"
                                >
                                    <div className="p-1.5 bg-slate-100 border border-slate-200 rounded-2xl shadow-xl">
                                        <div className="relative rounded-xl overflow-hidden bg-white">
                                            <Image
                                                src={selectedImage.preview}
                                                alt="Preview"
                                                width={96}
                                                height={96}
                                                className="h-24 w-24 object-cover"
                                                unoptimized
                                            />
                                            <button
                                                onClick={() => setSelectedImage(null)}
                                                className="absolute top-1 right-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1.5 transition-all shadow-md"
                                            >
                                                <X size={14} strokeWidth={3} />
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

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="shrink-0 w-14 h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#00bfa5] flex items-center justify-center transition-all group"
                                        title="Add image"
                                    >
                                        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" strokeWidth={3} />
                                    </button>

                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress as any}
                                        placeholder="Ask about syllabus, previous year papers or topics..."
                                        rows={1}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00bfa5]/40 focus:ring-4 focus:ring-[#00bfa5]/5 disabled:opacity-50 transition-all resize-none min-h-[56px] max-h-[150px] font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={sendMessage}
                                disabled={loading || (!input.trim() && !selectedImage)}
                                className="shrink-0 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white w-24 md:w-32 h-14 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-slate-900/10 active:scale-95 disabled:shadow-none flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Consult'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

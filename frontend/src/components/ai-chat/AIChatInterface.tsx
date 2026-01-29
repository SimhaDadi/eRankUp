'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTED_PROMPTS = [
    'Explain Time and Work concepts for SSC CGL',
    'Give me 5 Reasoning questions for RRB NTPC',
    'Important Current Affairs for SSC CHSL',
    'Explain Newton\'s Laws for Railway Group D',
    'Create a 30-day study plan for SSC CGL',
    'Shortcut tricks for Profit and Loss',
];

export default function AIChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await api.post('/ai-chat/message', {
                conversationId,
                message: userMessage,
            });

            setConversationId(response.data.conversationId);
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
        } catch (error) {
            console.error('Failed to send message', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.',
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
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 shadow-2xl">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🤖</span>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Tutor</h1>
                            <p className="text-sm text-purple-100">
                                Personalized to your learning needs
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
                                {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                                    <motion.button
                                        key={suggestion}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => handleUseSuggestion(suggestion)}
                                        className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-purple-500 text-white p-4 rounded-xl text-left transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl group-hover:scale-110 transition-transform">
                                                💡
                                            </span>
                                            <span className="text-sm">{suggestion}</span>
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
                                    className={`max-w-[80%] p-5 rounded-2xl shadow-lg ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'bg-slate-800/80 text-slate-100 border border-slate-700'
                                        }`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm font-semibold">
                                            <span>🤖</span>
                                            <span>Tutor</span>
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
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
                            <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 text-purple-400 text-sm font-semibold">
                                    <span>🤖</span>
                                    <span>Tutor</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div
                                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                        style={{ animationDelay: '0.1s' }}
                                    ></div>
                                    <div
                                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                                        style={{ animationDelay: '0.2s' }}
                                    ></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about your exam prep..."
                            disabled={loading}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/50 disabled:shadow-none"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Thinking...
                                </span>
                            ) : (
                                'Send'
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                        AI responses are generated based on your learning progress and weak areas
                    </p>
                </div>
            </div>
        </div>
    );
}

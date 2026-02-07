'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ChatSupport() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const socketRef = useRef<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (isOpen && !socketRef.current) {
            const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
            console.log(`[ChatSupport] Connecting to ${socketUrl}...`);

            socketRef.current = io(socketUrl, {
                query: { token },
                transports: ['websocket'],
            });

            socketRef.current.on('connect', () => {
                console.log('[ChatSupport] Socket connected successfully');
            });

            socketRef.current.on('connect_error', (error: Error) => {
                console.error('[ChatSupport] Socket connection error:', error.message);
            });

            socketRef.current.on('receiveMessage', (data: any) => {
                setMessages((prev) => [...prev, data]);
            });

            socketRef.current.on('previousMessages', (data: any) => {
                setMessages(data);
            });
        }

        if (!isOpen && socketRef.current) {
            // We can keep it connected or disconnect. For support, maybe keep connected?
            // Let's disconnect for now to save resources.
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [isOpen, token]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Click outside detection
    const chatWidgetRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (chatWidgetRef.current && !chatWidgetRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const sendMessage = () => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit('sendMessage', { message });
            setMessage('');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50" ref={chatWidgetRef}>
            {isOpen ? (
                <div className="bg-slate-900 border border-slate-800 w-80 h-[450px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-blue-600 p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="font-bold text-white">eRankUp Support</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white opacity-80 hover:opacity-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                        {messages.length === 0 && (
                            <div className="text-center py-10">
                                <MessageCircle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm">How can we help you today?</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isMe = msg.userId === user?.id;
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                        }`}>
                                        {!isMe && <div className="text-[10px] font-bold text-blue-400 mb-1">{msg.user}</div>}
                                        <p>{msg.message}</p>
                                        <div className="text-[9px] opacity-50 mt-1 text-right">
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-600 p-2 rounded-xl text-white hover:bg-blue-500 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-blue-500 transition-all hover:scale-110 active:scale-95 group"
                >
                    <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </button>
            )}
        </div>
    );
}

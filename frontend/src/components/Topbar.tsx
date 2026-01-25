'use client';

import { useState, useEffect, useRef } from 'react';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Bell, Search, ChevronDown, User, Settings, LogOut, Check } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    type?: string;
}

export default function Topbar() {
    const { user, logout } = useAuthStore();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Sync local state with URL
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
    }, [searchParams]);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        router.replace(`?${params.toString()}`);
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/admin/notifications/my');
            if (Array.isArray(res.data)) {
                setNotifications(res.data);
                setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Optional: Poll every minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/admin/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    useEffect(() => {
        setMounted(true);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!mounted) {
        return (
            <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-[100] shadow-sm">
                <div className="flex items-center bg-gray-100/50 rounded-xl px-4 py-2 w-96 border border-gray-200">
                    <Search className="w-4 h-4 text-gray-400 mr-3" />
                    <input type="text" placeholder="Search anything..." className="bg-transparent text-sm w-full outline-none" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
            {/* Search Bar */}
            {pathname === '/dashboard' ? (
                <div className="flex items-center bg-gray-100/50 rounded-xl px-4 py-2 w-96 border border-gray-200 focus-within:border-[#00bfa5] focus-within:ring-2 focus-within:ring-[#00bfa5]/10 transition-all duration-300">
                    <Search className="w-4 h-4 text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="bg-transparent text-sm w-full outline-none text-slate-900 placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            ) : (
                <div className="flex-1" />
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative text-gray-400 hover:text-[#00bfa5] transition-all duration-300 hover:scale-110 p-1"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100/50 p-0 z-50 flex flex-col animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                                {unreadCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{unreadCount} New</span>}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">No notifications yet</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => !notif.isRead && markAsRead(notif.id)}
                                            className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer relative ${!notif.isRead ? 'bg-cyan-50/30' : ''}`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{notif.title}</h4>
                                                {!notif.isRead && <div className="w-2 h-2 bg-[#00bfa5] rounded-full flex-shrink-0 mt-1.5" />}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.body}</p>
                                            <span className="text-[10px] text-slate-400 mt-2 block">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative pl-6 border-l border-gray-200" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded-2xl transition-all"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-900 tracking-tight">{user?.fullName || 'Student'}</p>
                            <p className="text-[10px] text-[#00bfa5] font-bold uppercase tracking-widest">{user?.role || 'Aspirant'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00bfa5] to-teal-400 flex items-center justify-center text-white font-bold border border-white/20 shadow-lg shadow-teal-500/20 transform hover:rotate-6 transition-transform">
                            {user?.fullName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-4 duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                <p className="text-sm font-bold text-slate-900">{user?.fullName}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <Link
                                href="/dashboard/settings"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors"
                            >
                                <User className="w-4 h-4" /> Profile
                            </Link>

                            <div className="h-px bg-gray-100 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

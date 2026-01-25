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
        <div className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 transition-all duration-300 backdrop-blur-md bg-white/80 border-b border-white/50 shadow-sm shadow-slate-200/50">
            {/* Search Bar */}
            {pathname === '/dashboard' ? (
                <div className="flex items-center bg-slate-100/50 hover:bg-slate-100 transition-colors rounded-2xl px-4 py-2.5 w-96 border border-slate-200/60 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white group">
                    <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors mr-3" />
                    <input
                        type="text"
                        placeholder="Search for tests, exams, or chapters..."
                        className="bg-transparent text-sm font-medium w-full outline-none text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
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
                        className={`relative p-2.5 rounded-xl transition-all duration-300 group ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-900'}`}
                    >
                        <Bell className={`w-5 h-5 ${isNotifOpen ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`} strokeWidth={2} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white ring-2 ring-rose-500/20 animate-pulse"></span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-4 w-96 bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 p-0 z-50 flex flex-col animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden ring-1 ring-slate-900/5">
                            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-xl">
                                <h3 className="font-black text-sm text-slate-900 tracking-tight">Notifications</h3>
                                {unreadCount > 0 && <span className="text-[10px] font-black px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 uppercase tracking-wide">{unreadCount} New</span>}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                        <Bell className="w-8 h-8 text-slate-200" />
                                        <span>No notifications yet</span>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => !notif.isRead && markAsRead(notif.id)}
                                            className={`px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-all cursor-pointer relative group ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <h4 className={`text-sm leading-snug ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{notif.title}</h4>
                                                {!notif.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 shadow-sm shadow-blue-500/50" />}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed text-justify">{notif.body}</p>
                                            <span className="text-[10px] text-slate-400 mt-3 block font-medium">
                                                {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 border-t border-slate-100 bg-slate-50/30">
                                <button className="w-full py-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
                                    View All Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative pl-6 border-l border-slate-200" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-4 hover:bg-slate-50 p-1.5 pr-3 rounded-2xl transition-all border border-transparent hover:border-slate-100 group"
                    >
                        <div className="text-right hidden md:block transition-transform group-hover:-translate-x-1">
                            <p className="text-sm font-bold text-slate-900 tracking-tight leading-tight">{user?.fullName || 'Student'}</p>
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{user?.role || 'Aspirant'}</p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25 ring-2 ring-white transform group-hover:scale-105 transition-all">
                            {user?.fullName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-all duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-4 w-64 bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-100 p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-4 duration-200 ring-1 ring-slate-900/5">
                            <div className="px-4 py-4 border-b border-slate-50 mb-1 bg-slate-50/50 rounded-2xl">
                                <p className="text-sm font-black text-slate-900">{user?.fullName}</p>
                                <p className="text-xs text-slate-500 truncate font-medium">{user?.email}</p>
                            </div>
                            <Link
                                href="/dashboard/settings"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all group"
                            >
                                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                Profile Settings
                            </Link>

                            <div className="h-px bg-slate-100 my-1 mx-2" />

                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all group"
                            >
                                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

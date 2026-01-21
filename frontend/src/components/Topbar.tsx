'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Bell, Search, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function Topbar() {
    const { user, logout } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!mounted) {
        return (
            <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
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
        <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
            {/* Search Bar */}
            <div className="flex items-center bg-gray-100/50 rounded-xl px-4 py-2 w-96 border border-gray-200 focus-within:border-[#00bfa5] focus-within:ring-2 focus-within:ring-[#00bfa5]/10 transition-all duration-300">
                <Search className="w-4 h-4 text-gray-400 mr-3" />
                <input
                    type="text"
                    placeholder="Search anything..."
                    className="bg-transparent text-sm w-full outline-none text-slate-900 placeholder-gray-500"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <button className="relative text-gray-400 hover:text-[#00bfa5] transition-all duration-300 hover:scale-110">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="relative pl-6 border-l border-gray-200">
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
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-1 animate-in fade-in slide-in-from-top-4 duration-200">
                                <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                    <p className="text-sm font-bold text-slate-900">{user?.fullName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <Link href="/dashboard/settings" className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                    <User className="w-4 h-4" /> Profile
                                </Link>
                                <Link href="/dashboard/settings" className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                    <Settings className="w-4 h-4" /> Settings
                                </Link>
                                <div className="h-px bg-gray-100 my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

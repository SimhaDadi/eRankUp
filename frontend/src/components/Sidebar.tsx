'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Zap,
    Tv,
    Book,
    Layers,
    Activity,
    FileText,
    Crosshair,
    Clock,
    CheckCircle,
    Ticket,
    Crown,
    Star,
    Trophy,
    List,
    Bookmark,
    AlertTriangle,
    HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NavItem {
    icon: any;
    label: string;
    href: string;
    badge?: string;
    badgeColor?: string;
}

interface NavSection {
    title?: string;
    items: NavItem[];
}

interface SidebarProps {
    customNavSections?: NavSection[];
    title?: string;
}

export default function Sidebar({ customNavSections, title }: SidebarProps) {
    const pathname = usePathname();

    const defaultSections: NavSection[] = [
        {
            items: [
                { icon: Home, label: 'Home', href: '/dashboard' }
            ]
        },
        {
            title: 'LEARN',
            items: [
                // { icon: Zap, label: 'SuperCoaching', href: '/dashboard/super-coaching' },
                // { icon: Tv, label: 'Live Classes', href: '/dashboard/live', badge: 'FREE', badgeColor: 'bg-green-500' },
                // { icon: Book, label: 'Books', href: '/dashboard/books' },
            ]
        },
        {
            title: 'TESTS',
            items: [
                { icon: Layers, label: 'Test Series', href: '/dashboard/exams' }, // Main exams page
                { icon: Activity, label: 'Live Tests & Quizzes', href: '/dashboard/live-tests' },
                { icon: FileText, label: 'Previous Year Papers', href: '/dashboard/pyp' },
                { icon: Crosshair, label: 'Practice', href: '/dashboard/practice' },
                { icon: Clock, label: 'Free Quizzes', href: '/dashboard/quizzes', badge: 'NEW', badgeColor: 'bg-orange-500' },
                { icon: CheckCircle, label: 'Attempted Tests', href: '/dashboard/performance' }, // Performance page
                { icon: Ticket, label: 'Pass', href: '/dashboard/pass' },
                // { icon: Crown, label: 'Pass Pro', href: '/dashboard/pass-pro' },
                // { icon: Star, label: 'Pass Elite', href: '/dashboard/pass-elite' },
                // { icon: Trophy, label: 'Rank Predictor', href: '/dashboard/leaderboard', badge: 'NEW', badgeColor: 'bg-orange-500' }, // Leaderboard
            ]
        },
        {
            title: 'MISCELLANEOUS',
            items: [
                { icon: List, label: 'Exams', href: '/dashboard/all-exams' },
                { icon: Bookmark, label: 'Saved Questions', href: '/dashboard/saved' },
                { icon: AlertTriangle, label: 'Reported Questions', href: '/dashboard/reported' },
                { icon: HelpCircle, label: 'Doubts', href: '/dashboard/doubts' },
            ]
        }
    ];

    const sections = customNavSections || defaultSections;

    return (
        <div className="h-screen w-64 bg-[#1a1d21] text-white flex flex-col fixed left-0 top-0 overflow-y-auto z-30 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {/* Logo Area */}
            <div className="p-5 border-b border-gray-800">
                <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105 cursor-pointer">
                    <div className="w-8 h-8 bg-[#00bfa5] rounded-lg flex items-center justify-center font-bold text-white text-lg">
                        e
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">{title || 'eRankUp'}</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4">
                {sections.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        {section.title && (
                            <div className="px-6 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                {section.title}
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                            ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                        <span className="font-medium">{item.label}</span>
                                        {item.badge && (
                                            <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${item.badgeColor || 'bg-blue-500'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeSide"
                                                className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer gradient fade (optional visual touch) */}
            <div className="h-20 bg-gradient-to-t from-[#1a1d21] to-transparent pointer-events-none fixed bottom-0 left-0 w-64" />
        </div>
    );
}

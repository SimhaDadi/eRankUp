import { useState, useEffect, useRef } from 'react';
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
    HelpCircle,
    ChevronLeft,
    Menu
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
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export default function Sidebar({ customNavSections, title, isCollapsed: controlledCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);

    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalIsCollapsed;
    const handleToggle = onToggle || (() => setInternalIsCollapsed(!internalIsCollapsed));
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Close sidebar when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && !isCollapsed) {
                if (onToggle) {
                    onToggle();
                } else {
                    setInternalIsCollapsed(true);
                }
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCollapsed]);

    const defaultSections: NavSection[] = [
        {
            items: [
                { icon: Home, label: 'Home', href: '/dashboard' }
            ]
        },
        {
            items: [
                // { icon: Zap, label: 'SuperCoaching', href: '/dashboard/super-coaching' },
                // { icon: Tv, label: 'Live Classes', href: '/dashboard/live', badge: 'FREE', badgeColor: 'bg-green-500' },
                // { icon: Book, label: 'Books', href: '/dashboard/books' },
            ]
        },
        {
            items: [
                { icon: Layers, label: 'Test Series', href: '/dashboard/test-series' },
                { icon: Activity, label: 'Live Tests & Quizzes', href: '/dashboard/live-exams' },
                { icon: FileText, label: 'Previous Year Papers', href: '/dashboard/pyp' },
                { icon: Crosshair, label: 'Practice', href: '/dashboard/practice' },
                { icon: Clock, label: 'Free Quizzes', href: '/dashboard/quizzes', badge: 'NEW', badgeColor: 'bg-orange-500' },
                { icon: CheckCircle, label: 'Attempted Tests', href: '/dashboard/performance' }, // Performance page
                { icon: Ticket, label: 'Pass', href: '/dashboard/plans' },
            ]
        },
        {
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
        <motion.div
            ref={sidebarRef}
            animate={{ width: isCollapsed ? 80 : 256 }}
            className="h-screen bg-[#1a1d21] text-white flex flex-col fixed left-0 top-0 overflow-y-auto z-30 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent border-r border-gray-800 shadow-xl"
        >
            {/* Logo Area */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1d21] z-20">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 transition-transform hover:scale-105 cursor-pointer overflow-hidden"
                >
                    <div className="w-8 h-8 min-w-[32px] bg-[#00bfa5] rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-teal-500/20">
                        e
                    </div>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xl font-bold tracking-tight text-white whitespace-nowrap"
                        >
                            {title || 'eRankUp'}
                        </motion.span>
                    )}
                </Link>

                <button
                    onClick={handleToggle}
                    className={`p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors ${isCollapsed ? 'hidden' : ''}`}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {isCollapsed && (
                    <button
                        onClick={handleToggle}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Expand Sidebar"
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 px-3">
                {sections.map((section, idx) => (
                    <div key={idx} className={`mb-6 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        {section.title && !isCollapsed && (
                            <div className="px-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                {section.title}
                            </div>
                        )}
                        <div className="space-y-1 w-full">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group overflow-hidden ${isActive
                                            ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                            } ${isCollapsed ? 'justify-center w-10 mx-auto' : ''}`}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <item.icon className={`w-5 h-5 min-w-[20px] transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />

                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="font-medium whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}

                                        {item.badge && !isCollapsed && (
                                            <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${item.badgeColor || 'bg-blue-500'}`}>
                                                {item.badge}
                                            </span>
                                        )}

                                        {isActive && !isCollapsed && (
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
            {!isCollapsed && <div className="h-20 bg-gradient-to-t from-[#1a1d21] to-transparent pointer-events-none fixed bottom-0 left-0 w-64" />}
        </motion.div>
    );
}

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
    }, [isCollapsed, onToggle]);

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
                { icon: Activity, label: 'Live Tests', href: '/dashboard/live-exams' },
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
        },
    ];

    const sections = customNavSections || defaultSections;

    // Color mapping for "living" icons
    const getItemColor = (label: string) => {
        const colors: Record<string, string> = {
            'Home': 'from-blue-500 to-indigo-600',
            'Test Series': 'from-violet-500 to-purple-600',
            'Live Tests': 'from-rose-500 to-pink-600',
            'Previous Year Papers': 'from-amber-400 to-orange-500',
            'Practice': 'from-emerald-400 to-teal-500',
            'Free Quizzes': 'from-cyan-400 to-blue-500',
            'Attempted Tests': 'from-lime-400 to-green-500',
            'Pass': 'from-yellow-400 to-amber-500',
            'Exams': 'from-indigo-400 to-blue-600',
            'Saved Questions': 'from-fuchsia-500 to-pink-600',
            'Reported Questions': 'from-red-500 to-rose-600',
            'Doubts': 'from-teal-400 to-emerald-600',
        };
        return colors[label] || 'from-slate-700 to-slate-900';
    };

    const sidebarVariants = {
        expanded: { width: 290 },
        collapsed: { width: 90 }
    };

    const textVariants = {
        expanded: { opacity: 1, x: 0, width: "auto", display: "flex" },
        collapsed: { opacity: 0, x: -10, width: 0, transition: { duration: 0.1 }, display: "none" }
    };

    return (
        <motion.div
            ref={sidebarRef}
            initial={isCollapsed ? "collapsed" : "expanded"}
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-screen bg-white text-slate-800 flex flex-col fixed left-0 top-0 overflow-y-auto overflow-x-hidden z-30 scrollbar-none border-r border-slate-100 shadow-2xl shadow-slate-200/50"
        >
            {/* Larger Logo Area */}
            <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 cursor-pointer overflow-hidden group z-50 transition-opacity hover:opacity-90"
                >
                    <div className="w-11 h-11 min-w-[44px] bg-slate-900 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-xl shadow-slate-900/20 ring-1 ring-slate-900/10 relative overflow-hidden transition-transform group-hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10">e</span>
                    </div>

                    <motion.div
                        variants={textVariants}
                        className="flex flex-col whitespace-nowrap"
                    >
                        <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
                            eRankUp
                        </span>
                    </motion.div>
                </Link>

                <button
                    onClick={handleToggle}
                    className={`z-50 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors ${isCollapsed ? 'hidden' : ''}`}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                {isCollapsed && (
                    <button
                        onClick={handleToggle}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40"
                        title="Expand Sidebar"
                    />
                )}
            </div>

            {/* Living Navigation */}
            <div className="flex-1 py-2 px-3 space-y-2 overflow-y-auto scrollbar-none">
                {sections.map((section, idx) => (
                    <div key={idx} className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                        {section.title && (
                            <motion.div
                                variants={textVariants}
                                className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 opacity-60 whitespace-nowrap overflow-hidden"
                            >
                                {section.title}
                            </motion.div>
                        )}
                        <div className="space-y-1 w-full relative">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                const gradient = getItemColor(item.label);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`relative flex items-center gap-4 px-3 py-2 rounded-2xl transition-all duration-200 group ${isActive
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 z-10'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                            } ${isCollapsed ? 'justify-center w-14 h-14 mx-auto p-0' : ''}`}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        {/* Living Icon Container */}
                                        <div className={`relative z-10 w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm shrink-0 ${isActive
                                            ? `bg-gradient-to-br ${gradient} text-white shadow-lg scale-105`
                                            : 'bg-white border-2 border-slate-200 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700 group-hover:scale-110'
                                            }`}>
                                            <item.icon className="w-5 h-5" strokeWidth={isActive ? 3 : 2.5} />
                                        </div>

                                        <motion.span
                                            variants={textVariants}
                                            className={`text-[15px] tracking-tight whitespace-nowrap font-black leading-none pt-0.5 overflow-hidden ${isActive ? 'text-white' : ''}`}
                                        >
                                            {item.label}
                                        </motion.span>

                                        {item.badge && (
                                            <motion.span
                                                variants={textVariants}
                                                className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm ${item.badgeColor || 'bg-blue-500'}`}
                                            >
                                                {item.badge}
                                            </motion.span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Upgrade / Pro Access Area */}
            <motion.div
                variants={{
                    expanded: { opacity: 1, scale: 1, height: "auto", margin: "1rem" },
                    collapsed: { opacity: 1, scale: 1, height: "auto", margin: "0.5rem" }
                }}
                className="mt-auto bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group mb-4 transition-all duration-300"
            >
                {isCollapsed ? (
                    <Link
                        href="/dashboard/plans"
                        className="w-14 h-14 mx-auto flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden group/mini"
                        title="Upgrade to Pro"
                    >
                        <Crown className="w-6 h-6 z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover/mini:opacity-100 transition-opacity" />
                    </Link>
                ) : (
                    <Link href="/dashboard/plans" className="p-4 relative z-10 flex items-center justify-between gap-3 min-w-[200px]">
                        <div>
                            <h4 className="font-black text-sm text-slate-900 leading-none mb-1">Pro Access</h4>
                            <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase tracking-tight">Unlock premium</p>
                        </div>
                        <div className="px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all hover:bg-black">
                            UPGRADE
                        </div>
                    </Link>
                )}
            </motion.div>
        </motion.div>
    );
}

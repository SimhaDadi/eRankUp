'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'AI Tutor', href: '/ai-study', icon: '🤖' },
    { name: 'Practice', href: '/practice', icon: '📝' },
    { name: 'Badges', href: '/badges', icon: '🏆' },
    { name: 'Leaderboard', href: '/leaderboard', icon: '👑' },
    { name: 'Results', href: '/dashboard/results', icon: '📈' },
];

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="bg-slate-900 border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="text-2xl font-bold text-white">
                            eRankUp
                        </Link>

                        <div className="hidden md:flex items-center gap-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

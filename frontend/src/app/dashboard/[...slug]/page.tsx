'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ComingSoonPage() {
    const pathname = usePathname();
    // specific feature name derived from path (e.g. /dashboard/super-coaching -> Super Coaching)
    const featureName = pathname?.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Feature';

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-32 h-32 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-[2rem] flex items-center justify-center shadow-xl mb-4 border border-white"
            >
                <div className="w-20 h-20 bg-gradient-to-br from-[#00bfa5] to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform duration-300">
                    <Construction className="w-10 h-10 text-white" />
                </div>
            </motion.div>

            <div className="space-y-4 max-w-lg">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-black text-slate-900 tracking-tight"
                >
                    {featureName} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-300">Coming Soon</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-slate-500 font-medium leading-relaxed"
                >
                    We're working hard to bring you the best <b>{featureName}</b> experience.
                    This feature will be available in the next major update.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-slate-700 font-bold shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </Link>
            </motion.div>
        </div>
    );
}

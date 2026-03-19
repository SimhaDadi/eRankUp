'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Search, Sparkles, Rocket, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ComingSoonPage() {
    const pathname = usePathname();
    const router = useRouter();

    // [TECH LEAD FIX] Redirect Guard: If this catch-all captures an active route segment
    // due to Next.js specificity glitches, manually push back to the correct page.
    useEffect(() => {
        if (pathname?.includes('/assessment-start/')) {
            // Force a slight delay to allow router to stabilize or just push
            router.replace(pathname);
        }
    }, [pathname, router]);

    const featureName = pathname?.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Advanced Feature';

    return (
        <div className="min-h-[85vh] relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 45, 0],
                        opacity: [0.2, 0.1, 0.2]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#00bfa5]/15 to-teal-500/5 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, -30, 0],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-cyan-100/20 to-blue-50/10 rounded-full blur-[80px]"
                />

                {/* Blueprint Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] pointer-events-none" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-2xl"
            >
                {/* Glassmorphism Card */}
                <div className="bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-8 md:p-12 shadow-[0_24px_96px_-12px_rgba(0,191,165,0.08)] relative overflow-hidden group">

                    {/* Interior Decorative Glow */}
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00bfa5]/5 rounded-full blur-[80px] group-hover:bg-[#00bfa5]/10 transition-colors duration-1000" />

                    <div className="flex flex-col items-center text-center space-y-8 relative z-20">

                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-6 border border-dashed border-slate-100 rounded-full pointer-events-none opacity-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="w-32 h-32 bg-gradient-to-tr from-slate-50 to-white rounded-[2rem] flex items-center justify-center shadow-xl border border-white relative"
                            >
                                <div className="absolute inset-2 bg-gradient-to-br from-[#00bfa5] to-teal-600 rounded-[1.5rem] opacity-5 blur-xl group-hover:opacity-20 transition-opacity" />
                                <div className="w-24 h-24 relative z-10 p-2">
                                    <Image
                                        src="/images/coming-soon-icon.png"
                                        alt="Feature Development"
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-contain drop-shadow-lg transform -rotate-3 group-hover:rotate-6 transition-transform duration-500"
                                    />
                                </div>

                                {/* Floating Badges */}
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-50"
                                >
                                    <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Content Hierarchy */}
                        <div className="space-y-4 max-w-lg mx-auto">
                            <div className="space-y-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.3em] shadow-md mb-2"
                                >
                                    <Rocket className="w-3 h-3 text-[#00bfa5] fill-[#00bfa5]" /> Core Development
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight"
                                >
                                    {featureName} <br />
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00bfa5] via-teal-600 to-cyan-600">
                                        Coming Soon
                                    </span>
                                </motion.h1>
                            </div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-slate-500 font-medium leading-relaxed"
                            >
                                We're architecting a high-performance <b>{featureName}</b> engine.
                                Final refinements are currently in progress.
                            </motion.p>
                        </div>

                        {/* Simulated Progress State */}
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "100%", opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1.5, ease: "circOut" }}
                            className="w-full max-w-sm space-y-3"
                        >
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stability Check</span>
                                <span className="text-xs font-black text-[#00bfa5]">85% Ready</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30 p-0.5 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "85%" }}
                                    transition={{ delay: 0.8, duration: 2, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#00bfa5] to-teal-500 rounded-full shadow-[0_0_8px_rgba(0,191,165,0.3)] relative"
                                >
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                </motion.div>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                    <Shield className="w-2.5 h-2.5" /> Secure
                                </div>
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                    <Zap className="w-2.5 h-2.5" /> Fast
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Unit */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="pt-2"
                        >
                            <Link
                                href="/dashboard"
                                className="group/btn relative inline-flex items-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 border border-slate-100 hover:border-[#00bfa5]/20 hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all active:scale-95 overflow-hidden"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" /> Back to Dashboard
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-[#00bfa5] scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left" />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Industrial Decals */}
                    <div className="absolute top-6 left-6 text-[8px] font-black text-slate-100 uppercase tracking-[0.5em] select-none [writing-mode:vertical-lr]">
                        Build Revision v2.4.0
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

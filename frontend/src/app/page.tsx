'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    BookOpen,
    Users,
    Award,
    Target,
    Brain,
    Clock,
    BarChart3,
    ChevronRight,
    ChevronDown,
    Star,
    Play,
    Zap,
    CheckCircle2,
    Sparkles,
    Shield,
    TrendingUp,
    Trophy,
    Download,
    Smartphone,
    Search,
    PenTool,
    LineChart,
    Menu,
    X,
    Globe,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
    ArrowRight,
    Cpu,
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isExamsDropdownOpen, setIsExamsDropdownOpen] = useState(false);

    const examCategories = [
        { name: 'SSC CGL', href: '/dashboard/exams', students: '15k+' },
        { name: 'SSC CHSL', href: '/dashboard/exams', students: '12k+' },
        { name: 'RRB NTPC', href: '/dashboard/exams', students: '20k+' },
        { name: 'RRB Group D', href: '/dashboard/exams', students: '18k+' },
        { name: 'SBI PO', href: '/dashboard/exams', students: '10k+' },
        { name: 'IBPS PO', href: '/dashboard/exams', students: '9k+' },
        { name: 'IBPS Clerk', href: '/dashboard/exams', students: '11k+' },
        { name: 'UPSC CSE', href: '/dashboard/exams', students: '8k+' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Top Banner */}
            <div className="bg-[#10B981] text-white py-1.5 px-4 text-center text-xs font-semibold flex justify-between items-center relative z-[60]">
                <div className="flex-1 flex justify-center items-center gap-2">
                    <span className="bg-white text-[#10B981] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">New</span>
                    <span className="truncate max-w-[200px] sm:max-w-none">World's #1 Exam Preparation Platform with 375+ Exams!</span>
                </div>
                <button className="hidden sm:block text-white/90 hover:text-white text-xs font-bold transition-colors ml-4">
                    Download App
                </button>
            </div>

            <nav className="sticky top-0 z-[50] bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-[56px] gap-6">
                        {/* Logo Section */}
                        <div className="flex items-center gap-8 flex-shrink-0">
                            <Link href="/" className="flex items-center gap-2">
                                <span className="text-2xl font-black text-[#00bfa5] tracking-tighter">eRankUp</span>
                            </Link>

                            {/* Desktop Menu Items */}
                            <div className="hidden xl:flex items-center gap-6 text-[14px] font-medium text-slate-700">
                                {/* Exams Dropdown */}
                                <div
                                    className="group relative cursor-pointer hover:text-[#00bfa5] flex items-center gap-1 h-[56px]"
                                    onMouseEnter={() => setIsExamsDropdownOpen(true)}
                                    onMouseLeave={() => setIsExamsDropdownOpen(false)}
                                >
                                    <span>Exams</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#00bfa5] transition-colors" />

                                    {/* Dropdown Menu */}
                                    {isExamsDropdownOpen && (
                                        <div className="absolute top-[56px] left-0 w-[280px] bg-white shadow-2xl rounded-lg border border-gray-100 py-2 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Popular Exams</h3>
                                            </div>
                                            {examCategories.map((exam, index) => (
                                                <Link
                                                    key={index}
                                                    href={exam.href}
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group/item"
                                                >
                                                    <span className="text-sm font-semibold text-gray-700 group-hover/item:text-[#00bfa5]">{exam.name}</span>
                                                    <span className="text-xs text-gray-400 font-medium">{exam.students} students</span>
                                                </Link>
                                            ))}
                                            <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                                                <Link href="/dashboard/exams" className="flex items-center gap-2 text-sm font-bold text-[#00bfa5] hover:gap-3 transition-all py-2">
                                                    View All Exams <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[56px]">
                                    <span>SuperCoaching</span>
                                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] px-1.5 py-0.5 rounded ml-1 font-bold">New</span>
                                </Link>
                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[56px]">
                                    <span>Test Series</span>
                                </Link>
                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[56px]">
                                    <span>Skill Academy</span>
                                </Link>
                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[56px]">
                                    <span>Pass</span>
                                </Link>
                                <div className="group relative cursor-pointer hover:text-[#00bfa5] flex items-center gap-1 h-[56px]">
                                    <span>More</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#00bfa5] transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Search Bar - Authenticated Style */}
                        <div className="hidden md:flex flex-1 max-w-[420px] relative">
                            <div className="relative w-full group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <div className="flex items-center gap-2 border-r border-gray-300 pr-2">
                                        <span className="text-gray-500 text-xs font-semibold">Exams</span>
                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full h-[38px] pl-[88px] pr-10 rounded-md border border-gray-300 bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#00bfa5] focus:ring-1 focus:ring-[#00bfa5] transition-all"
                                    placeholder="Search for Exams..."
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#00bfa5]" />
                                </div>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button className="hidden sm:flex items-center gap-1 text-gray-600 hover:text-[#00bfa5] font-semibold text-sm px-2">
                                <Globe className="w-4 h-4" />
                                <span>Eng</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                            <Link href="/login" className="hidden sm:block text-slate-700 hover:text-[#00bfa5] font-bold text-sm px-4">
                                Login
                            </Link>
                            <Link href="/signup" className="hidden sm:block bg-[#00bfa5] hover:bg-[#00a693] text-white px-6 py-2.5 rounded font-bold text-sm transition-all shadow-sm">
                                Get Started
                            </Link>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="xl:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="xl:hidden absolute top-[72px] left-0 w-full bg-white border-b border-gray-200 shadow-xl p-4 flex flex-col gap-4 z-[50]">
                        <div className="flex gap-2">
                            <Link href="/login" className="flex-1 text-center border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-md">
                                Login
                            </Link>
                            <Link href="/signup" className="flex-1 text-center bg-[#00bfa5] text-white font-bold text-sm py-3 rounded-md">
                                Get Started
                            </Link>
                        </div>
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                className="block w-full h-[42px] pl-10 pr-4 rounded-md border border-gray-300 bg-gray-50 text-sm focus:outline-none focus:border-[#00bfa5]"
                                placeholder="Search exams..."
                            />
                        </div>
                        <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            <a href="#" className="py-3 px-2 border-b border-gray-100 flex justify-between items-center">Exams <ChevronRight className="w-4 h-4 text-gray-400" /></a>
                            <a href="#" className="py-3 px-2 border-b border-gray-100 flex justify-between items-center">SuperCoaching <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">NEW</span></a>
                            <a href="#tests" className="py-3 px-2 border-b border-gray-100">Test Series</a>
                            <a href="#skill" className="py-3 px-2 border-b border-gray-100">Skill Academy</a>
                            <a href="#pass" className="py-3 px-2">Pass</a>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section - Extremely Compact */}
            <section className="relative flex items-center bg-white overflow-hidden py-6">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00bfa5]/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

                <div className="max-w-[1440px] mx-auto px-6 relative z-10 w-full">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-left relative z-20"
                        >
                            {/* Live Activity Insight */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/5 rounded-full mb-6 border border-slate-200 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00bfa5] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00bfa5]"></span>
                                </span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <span className="text-slate-950">2,840 students</span> practicing right now
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-[54px] leading-[0.98] font-black text-slate-950 mb-4 tracking-tightest">
                                The AI Master App <br />
                                <span className="text-gradient-accent">For Selection</span>
                            </h1>

                            <p className="text-base text-slate-500 mb-6 max-w-lg leading-relaxed font-medium">
                                Join <span className="text-slate-950 font-bold underline decoration-[#00bfa5]/30">5.5 Cr+</span> achievers and dominate SSC, Banking, & Railways with AI.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                                <Link href="/signup" className="btn-ultra-blue w-full sm:w-auto text-sm px-8 h-12 group">
                                    Start Prep Free
                                </Link>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2.5">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                                <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" width={32} height={32} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-left leading-tight">
                                        <div className="text-[10px] font-black text-slate-950">Trusted by 5.5 Cr+</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative flex justify-center lg:justify-end"
                        >
                            <div className="relative w-full max-w-[500px] lg:max-w-[600px] floating">
                                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white group">
                                    <Image
                                        src="/hero_illustration_1768845362775.png"
                                        alt="Exam Prep"
                                        width={800}
                                        height={700}
                                        className="object-contain w-full h-auto"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
                                </div>

                                {/* Dynamic Insights */}
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -left-8 top-1/4 glass-panel p-4 rounded-[1.5rem] border-white/60 shadow-xl flex items-center gap-3"
                                >
                                    <div className="w-9 h-9 bg-[#00bfa5] rounded-xl flex items-center justify-center text-white">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-950">+15% Score</div>
                                        <div className="text-[9px] font-bold text-slate-400 tracking-tight uppercase">Avg. AI Improvement</div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 8, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -right-4 bottom-1/4 glass-panel p-4 rounded-[1.5rem] border-white/60 shadow-xl flex items-center gap-3"
                                >
                                    <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-950">24/7 AI Tutor</div>
                                        <div className="text-[9px] font-bold text-slate-400 tracking-tight uppercase">Instant Doubts Solved</div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Compact Insights Bar */}
            <section className="relative z-30 -mt-2 mb-8 px-6">
                <div className="max-w-[1200px] mx-auto">
                    <div className="glass-panel border-white/50 rounded-[1.25rem] p-2.5 flex flex-wrap justify-center items-center gap-4 md:gap-10 bg-white/60 shadow-lg">
                        <div className="flex items-center gap-3 px-2 flex-1 min-w-[160px] justify-center md:justify-start">
                            <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-slate-950">5.5 Cr+</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Active Students</div>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden md:block opacity-40"></div>
                        <div className="flex items-center gap-3 px-2 flex-1 min-w-[160px] justify-center md:justify-start">
                            <div className="w-10 h-10 bg-[#00bfa5]/10 text-[#00bfa5] rounded-xl flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-slate-950">98.2%</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Satisfaction Score</div>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden md:block opacity-40"></div>
                        <div className="flex items-center gap-3 px-2 flex-1 min-w-[160px] justify-center md:justify-start">
                            <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-slate-950">1,250+</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">AI Lessons Daily</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Exams - Tight */}
            <section id="exams" className="py-8 px-6 relative bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-6 gap-4">
                        <div className="max-w-xl">
                            <div className="w-10 h-1 bg-[#00bfa5] rounded-full mb-4"></div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-950 mb-4 tracking-tight">
                                Dominate Your <span className="text-gradient-accent">Dream Exam</span>
                            </h2>
                            <p className="text-base text-slate-500 font-medium">Precision mock tests & AI insights curated by toppers.</p>
                        </div>
                        <Link href="/signup" className="group flex items-center gap-2 text-slate-950 font-black tracking-widest text-[10px] uppercase hover:text-[#00bfa5] transition-all">
                            View All Categories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ExamCard
                            title="SSC CGL"
                            subtitle="Tier I & II Elite Collection"
                            tests="50+ Tests"
                            students="15k Aspirants"
                            gradient="from-[#00bfa5] to-emerald-400"
                            delay={0.1}
                        />
                        <ExamCard
                            title="Banking"
                            subtitle="IBPS & SBI PO Gold Series"
                            tests="45+ Tests"
                            students="12k Aspirants"
                            gradient="from-blue-600 to-blue-400"
                            delay={0.2}
                        />
                        <ExamCard
                            title="Railways"
                            subtitle="RRB NTPC Super Mock"
                            tests="30+ Tests"
                            students="20k Aspirants"
                            gradient="from-indigo-600 to-indigo-400"
                            delay={0.3}
                        />
                        <ExamCard
                            title="UPSC CSE"
                            subtitle="Prelims Master Pack"
                            tests="60+ Tests"
                            students="8k Aspirants"
                            gradient="from-slate-900 to-slate-700"
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* How It Works - Tight */}
            <section id="process" className="py-8 px-6 relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(#00bfa5_1px,transparent_1px)] [background-size:30px_30px]"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-8">
                        <span className="text-[#00bfa5] text-[9px] font-black uppercase tracking-widest bg-[#00bfa5]/10 px-2 py-1 rounded-full border border-[#00bfa5]/20 mb-4 inline-block">The 3-Step Edge</span>
                        <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Your Path to <span className="text-gradient-accent italic">Selection</span></h2>
                        <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">Streamlined for goal-oriented preparation.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Path - Desktop */}
                        <div className="hidden md:block absolute top-[50px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>

                        <div className="text-center group relative">
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:-rotate-6 transition-all duration-500 relative z-10">
                                <Search className="w-10 h-10 text-[#00bfa5]" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#00bfa5] rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg border-2 border-slate-950">1</div>
                            </div>
                            <h3 className="text-xl font-black mb-2">Select Exam</h3>
                            <p className="text-sm text-slate-400 font-medium">500+ categories. 92% students find theirs in 30s.</p>
                        </div>

                        <div className="text-center group relative">
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:rotate-6 transition-all duration-500 relative z-10">
                                <Target className="w-10 h-10 text-blue-500" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg border-2 border-slate-950">2</div>
                            </div>
                            <h3 className="text-xl font-black mb-2">Daily Practice</h3>
                            <p className="text-sm text-slate-400 font-medium">Adaptive tests that improve score by 15% avg.</p>
                        </div>

                        <div className="text-center group relative">
                            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:-rotate-3 transition-all duration-500 relative z-10">
                                <Trophy className="w-10 h-10 text-emerald-400" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg border-2 border-slate-950">3</div>
                            </div>
                            <h3 className="text-xl font-black mb-2">Get Selected</h3>
                            <p className="text-sm text-slate-400 font-medium">Join 28.5L+ successful aspirants this year.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why eRankUp? - Tight Bento */}
            <section id="features" className="py-8 px-6 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                        <div className="max-w-xl text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-black text-slate-950 mb-2 tracking-tight">The <span className="text-gradient-accent">Edge</span> You Deserve</h2>
                            <p className="text-sm text-slate-500 font-medium">Industry-leading AI combined with educator research.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-1.5 glass-panel flex items-center gap-2">
                                <div className="text-xl font-black text-slate-950">24/7</div>
                                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">AI Doubt<br />Solver</div>
                            </div>
                            <div className="px-4 py-1.5 glass-panel flex items-center gap-2">
                                <div className="text-xl font-black text-slate-950">2.5k</div>
                                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Daily<br />Tests</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 group">
                            <div className="ultra-card p-6 h-full bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
                                <div className="w-10 h-10 bg-[#00bfa5]/10 text-[#00bfa5] rounded-xl flex items-center justify-center mb-4">
                                    <Cpu className="w-5 h-5" />
                                </div>
                                <div className="inline-block px-2 py-0.5 bg-emerald-50 text-[9px] font-black text-emerald-600 uppercase tracking-widest rounded mb-3">Core Tech</div>
                                <h3 className="text-xl font-black text-slate-950 mb-2">AI-Adaptive Learning</h3>
                                <p className="text-slate-500 text-xs leading-relaxed font-medium max-w-sm">AI recalibrates difficulty instantly based on your response time.</p>
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <div className="ultra-card p-6 h-full bg-blue-50/10">
                                <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                    <Play className="w-5 h-5 fill-current" />
                                </div>
                                <h3 className="text-lg font-black text-slate-950 mb-1">Video Solutions</h3>
                                <p className="text-[10px] text-slate-500 font-medium">Step-by-step logic for 10L+ questions by experts.</p>
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <div className="ultra-card p-6 h-full bg-amber-50/10">
                                <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-950 mb-1">AIR Prediction</h3>
                                <p className="text-[10px] text-slate-500 font-medium">Know where you stand against 50k+ daily mock-takers.</p>
                            </div>
                        </div>
                        <div className="md:col-span-8 group">
                            <div className="ultra-card p-6 h-full bg-slate-950 text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center mb-4">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-black mb-1">Sync Everywhere</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium max-w-xs">Start on desktop, finish on mobile. Preparation on the go.</p>
                                </div>
                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success CTA - Tight */}
            <section className="py-8 px-6 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="ultra-card bg-slate-950 p-8 md:p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00bfa5]/10 rounded-full blur-[60px] -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[60px] -ml-32 -mb-32"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tightest leading-tight">
                                Your Goal is <span className="text-gradient-accent">Attainable.</span>
                            </h2>
                            <p className="text-base text-slate-400 mb-6 max-w-xl mx-auto font-medium">
                                Join 5.5 Cr+ aspirants dominating their exams. Start free.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link href="/signup" className="btn-ultra-blue text-sm px-8 h-12 flex items-center">
                                    Start Prep Free
                                </Link>
                                <Link href="/dashboard" className="px-8 h-12 rounded-lg border border-white/10 text-white font-black hover:bg-white hover:text-slate-950 transition-all flex items-center justify-center text-xs">
                                    Explore Pass
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Tight */}
            <footer className="bg-white border-t border-slate-100 pt-10 pb-6">
                <div className="max-w-[1440px] mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1">
                            <Link href="/" className="flex items-center gap-2 mb-4 group">
                                <div className="w-7 h-7 bg-gradient-to-br from-[#00bfa5] to-blue-500 rounded-lg flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                                    <Trophy className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-lg font-black text-slate-950 tracking-tightest">eRankUp</span>
                            </Link>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
                                AI-powered exam preparation for India's ambitious aspirants.
                            </p>
                            <div className="flex gap-2">
                                {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, index) => (
                                    <a key={index} href="#" className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#00bfa5] hover:text-white transition-all">
                                        <Icon className="w-3.5 h-3.5" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-black text-slate-950 uppercase tracking-widest text-[9px] mb-4 opacity-40">Exams</h4>
                            <ul className="space-y-2 text-slate-500 font-bold text-[10px]">
                                <li><a href="#" className="hover:text-[#00bfa5]">SSC CGL</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5]">Banking</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5]">Railways</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5]">UPSC</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-slate-950 uppercase tracking-widest text-[9px] mb-4 opacity-40">Company</h4>
                            <ul className="space-y-2 text-slate-500 font-bold text-[10px]">
                                <li><a href="#" className="hover:text-[#00bfa5]">Our Story</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5]">Careers</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5]">Press</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-slate-950 uppercase tracking-widest text-[9px] mb-4 opacity-40">Contact</h4>
                            <div className="flex items-center gap-2 text-slate-950 font-black text-[10px]">
                                <Smartphone className="w-3.5 h-3.5 text-[#00bfa5]" />
                                +91 99999 00000
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3 text-[8px] font-black uppercase tracking-widest text-slate-400">
                        <div>© 2026 eRankUp. Powered by AI.</div>
                        <div className="flex gap-4">
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Components - Ultra Modernized
function ExamCard({ title, subtitle, tests, students, gradient, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="ultra-card p-6 group cursor-pointer"
        >
            <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg text-white group-hover:scale-110 transition-transform`}>
                <Award className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-[9px] font-bold text-emerald-600 uppercase tracking-tighter rounded mb-3">
                <Sparkles className="w-2.5 h-2.5" /> High Success Rate
            </div>
            <h3 className="text-xl font-black text-slate-950 mb-1 group-hover:text-[#00bfa5] transition-colors tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-400 font-bold mb-4">{subtitle}</p>

            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-6 opacity-80">
                <span className="flex items-center gap-1.5">{tests}</span>
                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                <span className="flex items-center gap-1.5 text-slate-950">{students}</span>
            </div>

            <div className="w-full h-[46px] rounded-xl bg-slate-50 text-slate-950 font-black text-[11px] uppercase tracking-widest flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-all">
                Start Prep
            </div>
        </motion.div>
    );
}

function ProcessInfo({ icon, step, title, description, color }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center relative z-10"
        >
            <div className={`w-20 h-20 ${color} rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 mb-8 relative`}>
                <div className="absolute -top-3 -right-3 w-8 h-8 white bg-white rounded-full flex items-center justify-center text-sm font-black border border-gray-100 shadow-sm">
                    {step}
                </div>
                {icon}
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed max-w-sm">{description}</p>
        </motion.div>
    )
}

function FeatureBox({ icon, title, desc }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-3xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200/50"
        >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm text-[#00bfa5] border border-gray-100">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </motion.div>
    )
}

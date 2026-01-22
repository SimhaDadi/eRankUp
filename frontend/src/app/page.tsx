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

            {/* Main Navigation - Testbook Style */}
            <nav className="sticky top-0 z-[50] bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-[72px] gap-6">
                        {/* Logo Section */}
                        <div className="flex items-center gap-8 flex-shrink-0">
                            <Link href="/" className="flex items-center gap-2">
                                <span className="text-2xl font-black text-[#00bfa5] tracking-tighter">eRankUp</span>
                            </Link>

                            {/* Desktop Menu Items */}
                            <div className="hidden xl:flex items-center gap-6 text-[14px] font-medium text-slate-700">
                                {/* Exams Dropdown */}
                                <div
                                    className="group relative cursor-pointer hover:text-[#00bfa5] flex items-center gap-1 h-[72px]"
                                    onMouseEnter={() => setIsExamsDropdownOpen(true)}
                                    onMouseLeave={() => setIsExamsDropdownOpen(false)}
                                >
                                    <span>Exams</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#00bfa5] transition-colors" />

                                    {/* Dropdown Menu */}
                                    {isExamsDropdownOpen && (
                                        <div className="absolute top-[72px] left-0 w-[280px] bg-white shadow-2xl rounded-lg border border-gray-100 py-2 z-50">
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

                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[72px]">
                                    <span>SuperCoaching</span>
                                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] px-1.5 py-0.5 rounded ml-1 font-bold">New</span>
                                </Link>
                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[72px]">
                                    <span>Test Series</span>
                                </Link>
                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[72px]">
                                    <span>Skill Academy</span>
                                </Link>
                                <Link href="/dashboard" className="hover:text-[#00bfa5] flex items-center gap-1 h-[72px]">
                                    <span>Pass</span>
                                </Link>
                                <div className="group relative cursor-pointer hover:text-[#00bfa5] flex items-center gap-1 h-[72px]">
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
                                    className="block w-full h-[42px] pl-[88px] pr-10 rounded-md border border-gray-300 bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-[#00bfa5] focus:ring-1 focus:ring-[#00bfa5] transition-all"
                                    placeholder="Search for Exams, Mock Tests..."
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

            {/* Hero Section */}
            <section className="relative bg-gradient-to-b from-[#f0fcf9] via-[#f7fdfc] to-white pt-8 md:pt-16 pb-20 overflow-hidden">
                <div className="max-w-[1280px] mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-left relative z-20"
                        >
                            <h1 className="text-4xl md:text-[46px] leading-[1.1] font-extrabold text-slate-900 mb-6">
                                The Master App for <br />
                                <span className="text-[#00bfa5]">Complete Exam Preparation</span>
                            </h1>

                            <div className="flex items-center gap-3 text-sm font-bold text-slate-500 mb-8 max-w-lg">
                                <span className="text-slate-900">Learn</span>
                                <span className="text-[#00bfa5] text-lg">›</span>
                                <span className="text-slate-900">Practice</span>
                                <span className="text-[#00bfa5] text-lg">›</span>
                                <span className="text-slate-900">Improve</span>
                                <span className="text-[#00bfa5] text-lg">›</span>
                                <span className="bg-[#00bfa5]/10 text-[#00bfa5] px-2 py-0.5 rounded">Succeed</span>
                            </div>

                            <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
                                Join 5.5 Crore+ Students & Prepare for SSC, Banking, Railways & 100+ Govt. Exams with India's SuperTeachers.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                <Link href="/signup" className="bg-[#00bfa5] hover:bg-[#00a693] text-white px-8 py-3.5 rounded-lg font-bold text-base transition-all shadow-lg shadow-[#00bfa5]/20 hover:-translate-y-1">
                                    Get Started For Free
                                </Link>

                                <div className="flex items-center gap-3">
                                    <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-3 transition-colors border border-gray-800">
                                        <div className="w-5 h-5 relative">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-[#00C6FF] to-[#0072FF] clip-play opacity-0"></div>
                                            <Play className="w-5 h-5 text-white fill-white" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[9px] uppercase leading-none opacity-80 mb-0.5">Get it on</div>
                                            <div className="text-xs font-bold leading-none">Google Play</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative z-10 flex justify-center lg:justify-end"
                        >
                            <div className="relative w-full max-w-[500px] lg:max-w-[580px]">
                                <Image
                                    src="/hero_illustration_1768845362775.png"
                                    alt="Exam Preparation Graphic"
                                    width={600}
                                    height={500}
                                    className="object-contain w-full h-auto drop-shadow-xl"
                                    priority
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Bar Floating */}
            <section className="relative z-30 -mt-10 mb-16">
                <div className="max-w-[1100px] mx-auto px-6">
                    <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-6 md:p-8 flex flex-col md:flex-row justify-between divide-y md:divide-y-0 md:divide-x divide-gray-100 border border-gray-100">
                        <div className="flex items-center gap-4 px-4 py-2 flex-1">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900">5.5 Cr+</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Students</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-2 flex-1">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900">28.5 L+</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Selections</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-2 flex-1">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900">242 Cr+</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Test Attempts</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-2 flex-1">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                                <Play className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-slate-900">50k+</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Daily Classes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Exams Section */}
            <section id="exams" className="py-24 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                                Most Popular <span className="text-[#00bfa5]">Exam Series</span>
                            </h2>
                            <p className="text-lg text-gray-500">Premium quality test series crafted by experts and past toppers.</p>
                        </div>
                        <Link href="/signup" className="flex items-center gap-2 text-[#00bfa5] font-bold hover:gap-3 transition-all">
                            Explore All Categories <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ExamCard
                            title="SSC CGL"
                            subtitle="Tier I & II"
                            tests="50+ Tests"
                            students="15k Users"
                            gradient="from-blue-600 to-blue-500"
                            border="hover:border-blue-400"
                            delay={0.1}
                        />
                        <ExamCard
                            title="Banking"
                            subtitle="IBPS & SBI PO"
                            tests="45+ Tests"
                            students="12k Users"
                            gradient="from-emerald-600 to-emerald-500"
                            border="hover:border-emerald-400"
                            delay={0.2}
                        />
                        <ExamCard
                            title="Railways"
                            subtitle="RRB NTPC"
                            tests="30+ Tests"
                            students="20k Users"
                            gradient="from-cyan-600 to-cyan-500"
                            border="hover:border-cyan-400"
                            delay={0.3}
                        />
                        <ExamCard
                            title="UPSC CSE"
                            subtitle="Prelims"
                            tests="60+ Tests"
                            students="8k Users"
                            gradient="from-violet-600 to-violet-500"
                            border="hover:border-violet-400"
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="process" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="text-[#00bfa5] font-bold tracking-wider uppercase text-sm mb-3 block">Your Path to Success</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">3 Simple Steps to Crack Your Exam</h2>
                        <p className="text-xl text-gray-500">Our proven methodology ensures you're always moving forward.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-emerald-100 to-blue-100 -z-10 bg-[length:20px_20px] bg-dashed"></div>

                        <ProcessInfo
                            icon={<Search className="w-8 h-8 text-white" />}
                            step="01"
                            title="Choose Your Exam"
                            description="Select from 50+ government exam categories tailored to your goals."
                            color="bg-blue-600"
                        />
                        <ProcessInfo
                            icon={<PenTool className="w-8 h-8 text-white" />}
                            step="02"
                            title="Take Mock Tests"
                            description="Practice with AI-curated questions that mimic the real exam difficulty."
                            color="bg-[#00bfa5]"
                        />
                        <ProcessInfo
                            icon={<LineChart className="w-8 h-8 text-white" />}
                            step="03"
                            title="Analyze & Improve"
                            description="Get in-depth performance analytics to identify and fix your weak areas."
                            color="bg-blue-600"
                        />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 bg-white overflow-hidden border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-[#00bfa5] font-bold uppercase tracking-wider text-sm mb-3 block">Why Choose eRankUp</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900">Features That Drive Results</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <FeatureBox
                            icon={<Brain className="w-6 h-6" />}
                            title="Smart Analysis"
                            desc="Deep dive into your performance with granular metrics on precision, speed, and stamina."
                        />
                        <FeatureBox
                            icon={<Clock className="w-6 h-6" />}
                            title="Real-time Simulation"
                            desc="Experience the actual exam interface to avoid panic during the D-Day."
                        />
                        <FeatureBox
                            icon={<Target className="w-6 h-6" />}
                            title="Goal Tracking"
                            desc="Set personal score targets and let our AI guide your daily study plan."
                        />
                        <FeatureBox
                            icon={<Users className="w-6 h-6" />}
                            title="All India Rank"
                            desc="Know where you stand among thousands of aspirants with live leaderboards."
                        />
                        <FeatureBox
                            icon={<Download className="w-6 h-6" />}
                            title="Offline Mode"
                            desc="Download tests and attempt them anytime, anywhere without internet."
                        />
                        <FeatureBox
                            icon={<Zap className="w-6 h-6" />}
                            title="Instant Doubts"
                            desc="Get 24/7 expert support for any questions you find difficult."
                        />
                    </div>
                </div>
            </section>

            {/* Success CTA */}
            <section className="py-24 px-6 bg-[#0a1023] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00bfa5]/10 to-transparent"></div>
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
                        Ready to join the league of <br />
                        <span className="text-[#00bfa5]">Toppers?</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Don't just prepare, prepare to win. Join 50,000+ serious aspirants today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <Link href="/signup" className="bg-[#00bfa5] hover:bg-[#00a693] text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-xl hover:shadow-[#00bfa5]/25 hover:scale-105">
                            Start Your Free Trial
                        </Link>
                    </div>
                    <p className="mt-8 text-sm text-gray-500">No credit card required • Cancel anytime</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <Link href="/" className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-black text-xl">e</span>
                                </div>
                                <span className="text-xl font-black text-gray-900">eRankUp</span>
                            </Link>
                            <p className="text-gray-500 leading-relaxed mb-6">
                                Making government exam preparation accessible, affordable, and effective for every Indian student.
                            </p>
                            <div className="flex gap-4">
                                {[
                                    { Icon: Facebook, color: "hover:text-[#1877F2]", label: "Facebook" },
                                    { Icon: Twitter, color: "hover:text-[#1DA1F2]", label: "Twitter" },
                                    { Icon: Instagram, color: "hover:text-[#E4405F]", label: "Instagram" },
                                    { Icon: Linkedin, color: "hover:text-[#0A66C2]", label: "LinkedIn" },
                                    { Icon: Youtube, color: "hover:text-[#FF0000]", label: "YouTube" }
                                ].map((social, index) => (
                                    <a
                                        key={index}
                                        href="#"
                                        aria-label={social.label}
                                        className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-1 ${social.color}`}
                                    >
                                        <social.Icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Exams</h4>
                            <ul className="space-y-4 text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">SSC CGL</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">SBI PO</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">RRB NTPC</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">IBPS Clerk</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">UPSC CSE</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Company</h4>
                            <ul className="space-y-4 text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Press</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
                            <ul className="space-y-4 text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Previous Year Papers</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Daily Current Affairs</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Exam Notifications</a></li>
                                <li><a href="#" className="hover:text-[#00bfa5] transition-colors">Free Mock Tests</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
                        <div>© 2024 eRankUp Technologies Pvt Ltd. All rights reserved.</div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Sitemap</a>
                        </div>
                    </div>
                </div>
            </footer >
        </div >
    );
}

// Components
function ExamCard({ title, subtitle, tests, students, gradient, border, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -5 }}
            className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer ${border}`}
        >
            <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-6 shadow-md text-white`}>
                <Award className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#00bfa5] transition-colors">{title}</h3>
            <p className="text-sm text-gray-500 font-medium mb-4">{subtitle}</p>

            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mb-6">
                <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md">
                    <BookOpen className="w-3.5 h-3.5" /> {tests}
                </span>
                <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md">
                    <Users className="w-3.5 h-3.5" /> {students}
                </span>
            </div>

            <div className="w-full h-10 rounded-xl bg-gray-50 text-gray-900 font-bold text-sm flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all">
                Start Now
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

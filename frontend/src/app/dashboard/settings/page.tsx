'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Camera, Save, User as UserIcon, Book, Building, MapPin, Globe, Loader2, Calendar, Mail, Tag, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        education: '',
        category: '',
        location: '',
        defaultLanguage: 'English'
    });

    // Help format dates consistently
    const formatDateForInput = (dateVal: any) => {
        if (!dateVal) return '';
        if (typeof dateVal === 'string') {
            return dateVal.split('T')[0];
        }
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                try {
                    const res = await api.get('/users/profile');
                    if (res.data) {
                        // Fix for "undefined" in fullname
                        let cleanName = res.data.fullName || '';
                        if (cleanName.includes('undefined')) {
                            cleanName = cleanName.replace('undefined', '').trim();
                        }

                        setFormData({
                            fullName: cleanName,
                            dob: formatDateForInput(res.data.dob),
                            education: res.data.education || '',
                            category: res.data.category || '',
                            location: res.data.location || '',
                            defaultLanguage: res.data.defaultLanguage || 'English'
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        const payload = {
            ...formData,
            dob: formData.dob ? formData.dob : null,
        };

        try {
            const res = await api.patch('/users/profile', payload);
            if (res.data) {
                const updatedUser = {
                    ...res.data,
                    dob: formatDateForInput(res.data.dob)
                };

                if (user) {
                    setUser({ ...user, ...updatedUser });
                }
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            alert('Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = ['Profile', 'Your Exams', 'Account', 'Pass', 'Pass Pro'];

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4 md:px-0">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage your personal information and preferences.</p>
            </header>

            {/* Premium Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-10 w-fit overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 text-sm font-black tracking-wide rounded-xl transition-all whitespace-nowrap
                            ${activeTab === tab
                                ? 'bg-white text-[#00bfa5] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Success Alert */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-6 right-6 z-50 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-xl flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-emerald-900 text-sm">Success!</p>
                            <p className="text-emerald-700 text-xs font-medium">Your profile has been updated.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Tab Content */}
            {activeTab === 'Profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-slate-200/50 space-y-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-[#00bfa5]" />

                    <div className="max-w-4xl space-y-6">
                        {/* Profile Picture Section */}
                        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-center">
                            <label className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] md:text-left">
                                Profile Picture
                            </label>
                            <div className="flex items-center gap-8">
                                <div className="group relative">
                                    <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner transition-transform hover:scale-[1.02]">
                                        <UserIcon className="w-10 h-10" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button className="px-5 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-black border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm">
                                        Upload New
                                    </button>
                                    <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">JPG, PNG or GIF. Max size 2MB.</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields Grid */}
                        <div className="space-y-5">
                            {/* Full Name */}
                            <FormRow label="Full Name" icon={<UserIcon className="w-4 h-4" />}>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full max-w-md h-11 px-5 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-[#00bfa5] focus:ring-4 focus:ring-[#00bfa5]/10 shadow-sm"
                                    placeholder="Enter your full name"
                                />
                            </FormRow>

                            {/* Date of Birth */}
                            <FormRow label="Date of Birth" icon={<Calendar className="w-4 h-4" />}>
                                <input
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    className="w-full max-w-[240px] h-11 px-5 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-base text-slate-900 outline-none transition-all focus:bg-white focus:border-[#00bfa5] focus:ring-4 focus:ring-[#00bfa5]/10 shadow-sm cursor-pointer"
                                />
                            </FormRow>

                            {/* Education */}
                            <FormRow label="Education" icon={<Book className="w-4 h-4" />}>
                                <input
                                    type="text"
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    className="w-full max-w-md h-11 px-5 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.1em] placeholder:text-xs focus:bg-white focus:border-[#00bfa5] focus:ring-4 focus:ring-[#00bfa5]/10 shadow-sm"
                                    placeholder="Add Education"
                                />
                            </FormRow>

                            {/* Category */}
                            <FormRow label="Category" icon={<Tag className="w-4 h-4" />}>
                                <div className="relative max-w-[240px]">
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-base text-slate-900 outline-none transition-all appearance-none cursor-pointer focus:bg-white focus:border-[#00bfa5] focus:ring-4 focus:ring-[#00bfa5]/10 shadow-sm"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="General">General</option>
                                        <option value="OBC">OBC</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                        <option value="EWS">EWS</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </FormRow>

                            {/* Location */}
                            <FormRow label="Location" icon={<MapPin className="w-4 h-4" />}>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full max-w-md h-11 px-5 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.1em] placeholder:text-xs focus:bg-white focus:border-[#00bfa5] focus:ring-4 focus:ring-[#00bfa5]/10 shadow-sm"
                                    placeholder="Add Location"
                                />
                            </FormRow>

                            {/* Default Language */}
                            <FormRow label="Default Language" icon={<Globe className="w-4 h-4" />}>
                                <div className="relative max-w-[240px]">
                                    <select
                                        value={formData.defaultLanguage}
                                        onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                                        className="w-full h-11 pl-5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-base text-slate-900 outline-none transition-all appearance-none cursor-pointer focus:bg-white focus:border-[#00bfa5] focus:ring-4 focus:ring-[#00bfa5]/10 shadow-sm"
                                    >
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="marathi">Marathi</option>
                                        <option value="telugu">Telugu</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </FormRow>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="group relative flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-[#00bfa5] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 flex items-center gap-3">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Profile Settings
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'Pass' && (
                <PassSettingsTab />
            )}

            {activeTab !== 'Profile' && activeTab !== 'Pass' && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Accessing Neural Cache...</h3>
                        <p className="text-slate-500 max-w-sm font-medium">
                            The <b>{activeTab}</b> module is currently being calibrated. Please check back soon.
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveTab('Profile')}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                    >
                        Return to Profile
                    </button>
                </div>
            )}
        </div>
    );
}

function FormRow({ label, children, icon }: { label: string; children: React.ReactNode; icon: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 items-center group">
            <label className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] md:text-left group-hover:text-slate-600 transition-colors">
                {label} :
            </label>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

function Sparkles({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    );
}

function PassSettingsTab() {
    const [pass, setPass] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPass = async () => {
            try {
                const res = await api.get('/passes/my-pass');
                setPass(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPass();
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500 font-bold animate-pulse">Synchronizing Subscription Data...</div>;

    if (!pass) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-[2.5rem] p-16 shadow-2xl shadow-slate-200/50 flex flex-col items-center justify-center text-center space-y-8"
            >
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
                    <Building className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">No Active Strategy</h3>
                    <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                        Upgrade your account to unlock premium neural sets and advanced assessment tools.
                    </p>
                </div>
                <a href="/dashboard/plans" className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Initialize Upgrade
                </a>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-slate-200/50 space-y-12 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Neural Pass</h2>
                    <p className="text-slate-500 font-medium">Strategic resource allocation and subscription management.</p>
                </div>
                <div className="px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-200 flex items-center gap-3 w-fit shadow-sm shadow-emerald-500/10">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    {pass.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200 flex items-start gap-6 group hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                        <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                            <Zap className="w-7 h-7" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Protocol</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-1">{pass.pass?.title}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200/50">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment</span>
                                    <p className="text-sm font-black text-slate-700 mt-1">
                                        {new Date(pass.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Termination</span>
                                    <p className="text-sm font-black text-slate-700 mt-1 uppercase tracking-tighter">
                                        {new Date(pass.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] translate-x-10 -translate-y-10 group-hover:bg-indigo-500/20 transition-all" />
                    <div className="relative z-10 space-y-6 text-center lg:text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Runtime</span>
                        <div className="space-y-1">
                            <div className="text-6xl font-black text-white tracking-tighter">
                                {Math.ceil((new Date(pass.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                            </div>
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Days Remaining</div>
                        </div>
                        <div className="pt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" style={{ width: '70%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function Zap({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Camera, Save, User as UserIcon, Book, Building, MapPin, Globe, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        education: '',
        category: '',
        location: '',
        defaultLanguage: 'English'
    });

    useEffect(() => {
        if (user) {
            // Fetch latest profile data
            const fetchProfile = async () => {
                try {
                    const res = await api.get('/users/profile');
                    if (res.data) {
                        setFormData({
                            fullName: res.data.fullName || '',
                            dob: res.data.dob ? new Date(res.data.dob).toISOString().split('T')[0] : '',
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
            dob: formData.dob ? formData.dob : null, // Send null if empty
        };

        try {
            const res = await api.patch('/users/profile', payload);
            if (res.data) {
                // Update local store user object (merge active fields)
                if (user) {
                    setUser({ ...user, ...res.data });
                }
                alert('Profile updated successfully!');
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
        <div className="max-w-5xl mx-auto pb-20 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-4 text-sm font-bold tracking-wide border-b-2 transition-all whitespace-nowrap
                            ${activeTab === tab
                                ? 'border-[#00bfa5] text-[#00bfa5]'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Range */}
            {activeTab === 'Profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl space-y-12"
                >
                    {/* Width constraint for form alignment matching screenshot roughly */}
                    <div className="max-w-3xl mx-auto space-y-12">

                        {/* Profile Picture Section */}
                        <div className="flex items-center gap-12 group">
                            <label className="w-40 text-right text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Profile Picture :
                            </label>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-slate-100 shadow-inner flex items-center justify-center text-slate-400 overflow-hidden relative">
                                    {/* Placeholder or Image */}
                                    <UserIcon className="w-8 h-8" />
                                </div>
                                <button className="text-sm font-bold text-[#00bfa5] hover:underline">
                                    Change
                                </button>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="flex items-center gap-12">
                            <label className="w-40 text-right text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Full Name :
                            </label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full max-w-sm font-bold text-slate-700 bg-transparent border-b-2 border-transparent focus:border-[#00bfa5] outline-none transition-all py-1 px-2 hover:bg-slate-50 focus:bg-white"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="flex items-center gap-12">
                            <label className="w-40 text-right text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Date of Birth :
                            </label>
                            <div className="flex-1">
                                {formData.dob ? (
                                    <input
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        className="font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
                                    />
                                ) : (
                                    <button
                                        onClick={() => setFormData({ ...formData, dob: '2000-01-01' })} // Simple trigger to show input or just show empty input
                                        className="text-sm font-bold text-[#00bfa5] hover:underline flex items-center gap-2"
                                    >
                                        Add Date Of Birth
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="flex items-center gap-12">
                            <label className="w-40 text-right text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Education :
                            </label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    placeholder="Add Education"
                                    className={`w-full max-w-sm py-1 px-2 bg-transparent outline-none border-b-2 border-transparent focus:border-[#00bfa5] transition-all
                                        ${formData.education ? 'text-slate-700 font-medium' : 'text-[#00bfa5] font-bold placeholder-[#00bfa5]'}`}
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="flex items-center gap-12">
                            <label className="w-40 text-right text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Category :
                            </label>
                            <div className="flex-1">
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className={`bg-transparent outline-none cursor-pointer py-1
                                        ${formData.category ? 'text-slate-700 font-medium' : 'text-[#00bfa5] font-bold'}`}
                                >
                                    <option value="" disabled>Add Category</option>
                                    <option value="General">General</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="EWS">EWS</option>
                                </select>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-12">
                            <label className="w-40 text-right text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Location :
                            </label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Add Location"
                                    className={`w-full max-w-sm py-1 px-2 bg-transparent outline-none border-b-2 border-transparent focus:border-[#00bfa5] transition-all
                                        ${formData.location ? 'text-slate-700 font-medium' : 'text-[#00bfa5] font-bold placeholder-[#00bfa5]'}`}
                                />
                            </div>
                        </div>

                        {/* Default Language */}
                        <div className="flex items-center gap-12">
                            <label className="w-40 text-right text-sm font-bold text-slate-500 uppercase tracking-wide">
                                Default Language :
                            </label>
                            <div className="flex-1">
                                <select
                                    value={formData.defaultLanguage}
                                    onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                                    className="bg-transparent outline-none cursor-pointer py-1 text-slate-700 font-medium"
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="marathi">Marathi</option>
                                    <option value="telugu">Telugu</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-end border-t border-gray-100">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-[#00bfa5] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>

                    </div>
                </motion.div>
            )}

            {activeTab === 'Pass' && (
                <PassSettingsTab />
            )}

            {activeTab !== 'Profile' && activeTab !== 'Pass' && (
                <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                        <Book className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Coming Soon</h3>
                    <p className="text-slate-500 max-w-sm">
                        The <b>{activeTab}</b> section is currently under development. Stay tuned!
                    </p>
                </div>
            )}
        </div>
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

    if (loading) return <div className="p-10 text-center text-slate-500">Loading Pass Details...</div>;

    if (!pass) {
        return (
            <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-xl flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                    <Building className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No Active Pass</h3>
                <p className="text-slate-500 max-w-sm">
                    You don't have an active pass. Upgrade to unlock premium features and unlimited tests.
                </p>
                <a href="/dashboard/plans" className="mt-4 px-6 py-2 bg-[#00bfa5] text-white rounded-xl font-bold hover:bg-[#00a891] transition-colors">
                    View Plans
                </a>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">My Active Pass</h2>
                    <p className="text-slate-500 text-sm">Manage your subscription and billing details</p>
                </div>
                <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest border border-green-200 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {pass.status}
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Name</span>
                        <h3 className="text-xl font-black text-slate-800 mt-1">{pass.pass?.title}</h3>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchased On</span>
                            <p className="text-sm font-bold text-slate-700 mt-1">
                                {new Date(pass.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valid Until</span>
                            <p className="text-sm font-bold text-slate-700 mt-1">
                                {new Date(pass.expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full md:w-64">
                    <div className="text-center space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Days Remaining</span>
                        <div className="text-4xl font-black text-[#00bfa5]">
                            {Math.ceil((new Date(pass.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Enjoy your premium access!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

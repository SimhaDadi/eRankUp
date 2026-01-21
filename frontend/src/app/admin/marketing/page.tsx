'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Tag,
    Plus,
    Percent,
    Trash2,
    Calendar,
    Users,
    Mail,
    Send,
    FileText
} from 'lucide-react';
import api from '@/lib/api';

interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses?: number;
    usedCount: number;
    expiresAt: string;
    isActive: boolean;
}

interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    body: string;
    recipientType: 'ALL' | 'ACTIVE' | 'INACTIVE';
    status: 'DRAFT' | 'SENT' | 'SCHEDULED';
    sentAt?: string;
    sentCount: number;
    createdAt: string;
}

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState<'coupons' | 'emails'>('coupons');

    // Coupon State
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(true);
    const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        expiresAt: '',
        maxUses: ''
    });

    // Email State
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loadingEmails, setLoadingEmails] = useState(true);
    const [showCreateEmailModal, setShowCreateEmailModal] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        subject: '',
        body: '',
        recipientType: 'ALL'
    });

    useEffect(() => {
        if (activeTab === 'coupons') fetchCoupons();
        else fetchCampaigns();
    }, [activeTab]);

    // --- Coupon Logic ---
    const fetchCoupons = async () => {
        setLoadingCoupons(true);
        try {
            const res = await api.get('/admin/marketing/coupons');
            setCoupons(res.data);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setLoadingCoupons(false);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/marketing/coupons', {
                ...newCoupon,
                discountValue: parseFloat(newCoupon.discountValue),
                maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : undefined
            });
            setShowCreateCouponModal(false);
            setNewCoupon({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                expiresAt: '',
                maxUses: ''
            });
            fetchCoupons();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create coupon');
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await api.delete(`/admin/marketing/coupons/${id}`);
            fetchCoupons();
        } catch (error) {
            alert('Failed to delete coupon');
        }
    };

    // --- Email Logic ---
    const fetchCampaigns = async () => {
        setLoadingEmails(true);
        try {
            const res = await api.get('/admin/marketing/emails');
            setCampaigns(res.data);
        } catch (error) {
            console.error('Failed to fetch campaigns', error);
        } finally {
            setLoadingEmails(false);
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/marketing/emails', newCampaign);
            setShowCreateEmailModal(false);
            setNewCampaign({ name: '', subject: '', body: '', recipientType: 'ALL' });
            fetchCampaigns();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create campaign');
        }
    };

    const handleSendCampaign = async (id: string) => {
        if (!confirm('Are you sure you want to launch this campaign? This cannot be undone.')) return;
        try {
            await api.post(`/admin/marketing/emails/${id}/send`);
            alert('Campaign launched successfully!');
            fetchCampaigns();
        } catch (error) {
            alert('Failed to send campaign');
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm('Delete this campaign?')) return;
        try {
            await api.delete(`/admin/marketing/emails/${id}`);
            fetchCampaigns();
        } catch (error) {
            alert('Failed to delete campaign');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Marketing & Campaigns
                    </h1>
                    <p className="text-slate-400 font-medium mt-2">
                        Manage discount codes and email campaigns
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'coupons' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Coupons
                    </button>
                    <button
                        onClick={() => setActiveTab('emails')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'emails' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Email Campaigns
                    </button>
                </div>

                <button
                    onClick={() => activeTab === 'coupons' ? setShowCreateCouponModal(true) : setShowCreateEmailModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === 'coupons' ? 'Create Coupon' : 'New Campaign'}
                </button>
            </header>

            {/* Content Area */}
            {activeTab === 'coupons' ? (
                // Coupons Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loadingCoupons ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-40 bg-slate-900/40 rounded-3xl animate-pulse"></div>
                        ))
                    ) : coupons.length > 0 ? (
                        coupons.map((coupon) => (
                            <motion.div
                                key={coupon.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDeleteCoupon(coupon.id)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500">
                                        <Tag className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-widest">{coupon.code}</h3>
                                        <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Used: {coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''}
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl"></div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            <Tag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No active coupons found.</p>
                        </div>
                    )}
                </div>
            ) : (
                // Emails Grid
                <div className="space-y-4">
                    {loadingEmails ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-24 bg-slate-900/40 rounded-3xl animate-pulse"></div>
                        ))
                    ) : campaigns.length > 0 ? (
                        campaigns.map((campaign) => (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl group relative overflow-hidden"
                            >
                                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-white truncate">{campaign.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${campaign.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400' :
                                                campaign.status === 'SCHEDULED' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-slate-700 text-slate-300'
                                            }`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm truncate">{campaign.subject}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Target: {campaign.recipientType}</span>
                                        {campaign.status === 'SENT' && (
                                            <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Sent: {campaign.sentCount}</span>
                                        )}
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {campaign.status === 'DRAFT' && (
                                        <button
                                            onClick={() => handleSendCampaign(campaign.id)}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" /> Launch
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteCampaign(campaign.id)}
                                        className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No email campaigns found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Coupon Modal */}
            {showCreateCouponModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0c111d] border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Coupon</h2>
                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Coupon Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white uppercase font-bold tracking-wider focus:outline-none focus:border-blue-500"
                                    placeholder="SALE2024"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                        value={newCoupon.discountType}
                                        onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="20"
                                        value={newCoupon.discountValue}
                                        onChange={e => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Max Uses</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Unlimited"
                                        value={newCoupon.maxUses}
                                        onChange={e => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Exists Until</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                        value={newCoupon.expiresAt}
                                        onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateCouponModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                                >
                                    Create Coupon
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Create Email Modal */}
            {showCreateEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0c111d] border border-slate-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">New Email Campaign</h2>
                        <form onSubmit={handleCreateCampaign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Campaign Name (Internal)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Weekly Newsletter"
                                    value={newCampaign.name}
                                    onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Don't miss out!"
                                    value={newCampaign.subject}
                                    onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Recipient Segment</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    value={newCampaign.recipientType}
                                    onChange={e => setNewCampaign({ ...newCampaign, recipientType: e.target.value as any })}
                                >
                                    <option value="ALL">All Users</option>
                                    <option value="ACTIVE">Active Users</option>
                                    <option value="INACTIVE">Inactive Users</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email Body (HTML supported)</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="<html>...</html>"
                                    value={newCampaign.body}
                                    onChange={e => setNewCampaign({ ...newCampaign, body: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateEmailModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                                >
                                    Save Draft
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

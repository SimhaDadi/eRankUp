'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Calendar,
    Award,
    Target,
    Clock,
    CheckCircle,
    XCircle,
    ArrowLeft
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import api from '@/lib/api';
import Link from 'next/link';

export default function StudentDetailPage() {
    const params = useParams();
    const studentId = params.id as string;

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (studentId) {
            console.log('Fetching data for student:', studentId);
            fetchStudentData();
        } else {
            console.error('No student ID found in params');
        }
    }, [studentId]);

    const fetchStudentData = async () => {
        try {
            console.log('Initiating API calls...');
            const [detailsRes, attemptsRes, activityRes] = await Promise.all([
                api.get(`/analytics/students/${studentId}`),
                api.get(`/analytics/students/${studentId}/attempts`),
                api.get(`/analytics/students/${studentId}/activity`)
            ]);

            console.log('API calls successful', {
                profile: detailsRes.data.profile,
                stats: detailsRes.data.stats,
                attempts: attemptsRes.data,
                activity: activityRes.data
            });

            setProfile(detailsRes.data.profile);
            setStats(detailsRes.data.stats || {});
            setSubscription(detailsRes.data.subscription);
            setAttempts(attemptsRes.data || []);
            setActivity(activityRes.data || []);
        } catch (error) {
            console.error('Failed to fetch student details:', error);
            // setProfile(null); // Keep null to show "Not Found" or handle error state
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async () => {
        if (!profile) return;

        const newStatus = !profile.isActive;
        const action = newStatus ? 'restore' : 'restrict';

        if (!confirm(`Are you sure you want to ${action} access for ${profile.fullName}?`)) return;

        setActionLoading(true);
        try {
            await api.patch(`/users/${studentId}/status`, { isActive: newStatus });
            setProfile({ ...profile, isActive: newStatus });
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white">Student not found</h2>
                <Link href="/admin/students" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
                    &larr; Back to Students
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Back Link */}
            <div>
                <Link href="/admin/students" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Students
                </Link>

                <div className="flex flex-col xl:flex-row gap-6">
                    {/* Profile Card */}
                    <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6">
                            <button
                                onClick={toggleStatus}
                                disabled={actionLoading}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${profile.isActive
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                    }`}
                            >
                                {actionLoading ? 'Updating...' : profile.isActive ? 'Restrict Access' : 'Restore Access'}
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                                {profile.profilePicture ? (
                                    <img src={profile.profilePicture} alt={profile.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-slate-500" />
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-3xl font-black text-white">{profile.fullName}</h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${profile.isActive
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}>
                                            {profile.isActive ? 'Active' : 'Restricted'}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> {profile.email}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 w-5 flex justify-center"><User className="w-4 h-4" /></span>
                                        {profile.phone || 'No mobile number'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 w-5 flex justify-center"><Target className="w-4 h-4" /></span>
                                        {profile.location || 'Location not set'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 w-5 flex justify-center"><Calendar className="w-4 h-4" /></span>
                                        Joined {new Date(profile.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className="w-full xl:w-96 bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-3xl flex flex-col justify-center">
                        <h3 className="text-slate-400 font-medium text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4" /> Subscription Status
                        </h3>

                        {subscription ? (
                            <div>
                                <div className="text-2xl font-bold text-white mb-1">{subscription.planName}</div>
                                <div className={`text-sm font-medium mb-4 ${subscription.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                                    }`}>
                                    • {subscription.status}
                                </div>
                                <div className="text-slate-400 text-sm">
                                    Valid until <br />
                                    <span className="text-white font-medium">
                                        {new Date(subscription.expiryDate).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-600">
                                    <XCircle className="w-6 h-6" />
                                </div>
                                <div className="text-white font-medium">No Active Subscription</div>
                                <p className="text-xs text-slate-500 mt-1">This student is on the free tier.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Exams"
                        value={stats.totalAttempts}
                        icon={<Target className="w-5 h-5 text-blue-400" />}
                        color="blue"
                    />
                    <StatCard
                        title="Passed Exams"
                        value={stats.passedExams}
                        icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Avg. Score"
                        value={`${stats.averageScore}%`}
                        icon={<Award className="w-5 h-5 text-purple-400" />}
                        color="purple"
                    />
                    <StatCard
                        title="Accuracy"
                        value={`${stats.accuracy}%`}
                        icon={<Target className="w-5 h-5 text-amber-400" />}
                        color="amber"
                    />
                </div>
            )}

            {/* Performance Chart */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Performance Trend</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activity || []}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="date" stroke="#9ca3af" axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Score %" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Attempt History */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Exam History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-medium text-sm uppercase">
                                <th className="p-4">Exam</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-center">Score</th>
                                <th className="p-4 text-center">Accuracy</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {attempts && attempts.length > 0 ? (
                                attempts.map((attempt) => (
                                    <tr key={attempt.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-medium text-white">
                                            {attempt.exam ? attempt.exam.title : 'Deleted Exam'}
                                        </td>
                                        <td className="p-4 text-slate-400">
                                            {new Date(attempt.createdAt).toLocaleDateString()}
                                            <span className="text-xs text-slate-500 ml-2">
                                                {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold ${attempt.score >= 70 ? 'text-emerald-400' :
                                                attempt.score >= 40 ? 'text-white' : 'text-red-400'
                                                }`}>
                                                {Math.round(attempt.score)}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-slate-300">
                                            {Math.round(attempt.accuracy)}%
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${attempt.score >= 40 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {attempt.score >= 40 ? 'PASSED' : 'FAILED'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No exams taken yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    const colorClasses: { [key: string]: string } = {
        blue: 'bg-blue-500/10 text-blue-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        purple: 'bg-purple-500/10 text-purple-500',
        amber: 'bg-amber-500/10 text-amber-500',
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-black text-white">{value}</div>
        </motion.div>
    );
}

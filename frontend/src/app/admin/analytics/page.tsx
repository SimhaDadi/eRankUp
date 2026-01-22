'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    TrendingUp,
    Users,
    BookOpen,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import api from '@/lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [userStats, setUserStats] = useState<any>(null);
    const [examStats, setExamStats] = useState<any>(null);
    const [revenueStats, setRevenueStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [overviewRes, usersRes, examsRes, revenueRes] = await Promise.all([
                api.get('/analytics/overview'),
                api.get('/analytics/users'),
                api.get('/analytics/exams'),
                api.get('/analytics/revenue')
            ]);

            setStats(overviewRes.data);
            setUserStats(usersRes.data);
            setExamStats(examsRes.data);
            setRevenueStats(revenueRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Analytics Dashboard
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Comprehensive insights into platform performance and growth
                </p>
            </header>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats?.revenueStats?.totalRevenue.toLocaleString()}`}
                    change={stats?.revenueStats?.growth}
                    icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
                    color="emerald"
                />
                <StatCard
                    title="Active Students"
                    value={stats?.activeStudents}
                    change="+12%"
                    icon={<Users className="w-5 h-5 text-blue-400" />}
                    color="blue"
                />
                <StatCard
                    title="Total Exams"
                    value={stats?.totalExams}
                    change="+5%"
                    icon={<BookOpen className="w-5 h-5 text-purple-400" />}
                    color="purple"
                />
                <StatCard
                    title="Submissions Today"
                    value={stats?.submissionsToday}
                    change="+8%"
                    icon={<Activity className="w-5 h-5 text-amber-400" />}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <ChartCard title="Revenue Trend (Last 6 Months)">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueStats?.trend}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* User Growth */}
                <ChartCard title="User Growth">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userStats?.growth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                cursor={{ fill: '#374151', opacity: 0.4 }}
                            />
                            <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Popular Exams */}
                <div className="lg:col-span-2">
                    <ChartCard title="Most Popular Exams">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart layout="vertical" data={examStats?.popularExams}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" width={150} stroke="#9ca3af" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* User Distribution */}
                <ChartCard title="User Distribution">
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={userStats?.distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {userStats?.distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Recent Transactions */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">User</th>
                                <th className="p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">Exam</th>
                                <th className="p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">Date</th>
                                <th className="p-4 text-slate-400 font-medium text-sm uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {revenueStats?.recent.map((transaction: any) => (
                                <tr key={transaction.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-medium text-white">{transaction.user}</td>
                                    <td className="p-4 text-slate-300">{transaction.exam}</td>
                                    <td className="p-4 text-slate-400">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-emerald-400 font-bold text-right">
                                        ₹{transaction.amount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, icon, color }: any) {
    const isPositive = change?.startsWith('+');
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
                {change && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {change}
                    </div>
                )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
            <div className="text-3xl font-black text-white">{value}</div>
        </motion.div>
    );
}

function ChartCard({ title, children }: any) {
    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6">{title}</h3>
            {children}
        </div>
    );
}

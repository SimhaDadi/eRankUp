'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Zap,
    Database,
    Cloud,
    TrendingUp
} from 'lucide-react';
import api from '@/lib/api';

interface ServiceHealth {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number;
    lastChecked: string;
    details?: any;
}

interface APIUsage {
    service: string;
    callsToday: number;
    callsThisMonth: number;
    estimatedCost: number;
    limit?: number;
}

export default function SystemHealthWidget() {
    const [health, setHealth] = useState<{
        status: string;
        services: ServiceHealth[];
    } | null>(null);
    const [apiUsage, setApiUsage] = useState<APIUsage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [healthRes, usageRes] = await Promise.all([
                api.get('/admin/system/health'),
                api.get('/admin/system/api-usage')
            ]);

            setHealth(healthRes.data);
            setApiUsage(usageRes.data);
        } catch (error) {
            console.error('Failed to fetch system health:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'degraded':
                return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'down':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Activity className="w-4 h-4 text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-emerald-500/20 text-emerald-400';
            case 'degraded':
                return 'bg-amber-500/20 text-amber-400';
            case 'down':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-slate-500/20 text-slate-400';
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl p-6 shadow-xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-500" />
                    System Health
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(health?.status || 'unknown')}`}>
                    {health?.status || 'Unknown'}
                </span>
            </div>

            {/* Services Status */}
            <div className="space-y-3 mb-6">
                {health?.services.map((service, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            {getStatusIcon(service.status)}
                            <span className="font-medium text-slate-300">{service.service}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {service.responseTime && (
                                <span className="text-xs text-slate-500">
                                    {service.responseTime}ms
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(service.status)}`}>
                                {service.status}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* API Usage */}
            <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                    API Usage Today
                </h3>
                <div className="space-y-3">
                    {apiUsage.map((api, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">{api.service}</span>
                                <span className="text-white font-bold">
                                    {api.callsToday}{api.limit ? `/${api.limit}` : ''}
                                </span>
                            </div>
                            {api.limit && (
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${(api.callsToday / api.limit) > 0.8
                                                ? 'bg-red-500'
                                                : (api.callsToday / api.limit) > 0.5
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${Math.min((api.callsToday / api.limit) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            )}
                            {api.estimatedCost > 0 && (
                                <div className="text-xs text-slate-500">
                                    Est. cost: ₹{api.estimatedCost.toFixed(2)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                Auto-refreshes every 30 seconds
            </div>
        </div>
    );
}

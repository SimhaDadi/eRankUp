'use client';

import { useState, useEffect } from 'react';
import { Activity, Server, Database, Brain, CheckCircle, AlertTriangle, RefreshCw, Power } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceStatus {
    name: string;
    icon: any;
    status: 'Healthy' | 'Warning' | 'Offline';
    uptime: string;
    latency: string;
}

export default function AIServiceMonitor() {
    const [services, setServices] = useState<ServiceStatus[]>([
        { name: 'Core API Server', icon: Server, status: 'Healthy', uptime: '99.99%', latency: '45ms' },
        { name: 'PostgreSQL Database', icon: Database, status: 'Healthy', uptime: '100%', latency: '2ms' },
        { name: 'AI Inference Engine', icon: Brain, status: 'Warning', uptime: '98.2%', latency: '850ms' },
        { name: 'Redis Cache', icon: Activity, status: 'Healthy', uptime: '100%', latency: '1ms' },
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshStatus = () => {
        setIsRefreshing(true);
        // Simulate refresh
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1200);
    };

    return (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900">Infrastructure Health</h2>
                </div>
                <button
                    onClick={refreshStatus}
                    disabled={isRefreshing}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 text-slate-500"
                >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                    <div key={service.name} className="p-4 bg-slate-50 border border-gray-200 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${service.status === 'Healthy' ? 'bg-emerald-50' :
                                service.status === 'Warning' ? 'bg-amber-50' : 'bg-red-50'
                                }`}>
                                <service.icon className={`w-6 h-6 ${service.status === 'Healthy' ? 'text-emerald-600' :
                                    service.status === 'Warning' ? 'text-amber-600' : 'text-red-500'
                                    }`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">{service.name}</h3>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{service.uptime} Uptime</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{service.latency}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${service.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                                service.status === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {service.status}
                            </span>
                            <button className="text-[10px] text-slate-500 hover:text-blue-600 font-bold transition-colors flex items-center gap-1">
                                <Power className="w-3 h-3" /> System Logs
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
                <p className="text-slate-500">Live system status updated every 60s.</p>
                <div className="flex gap-4">
                    <button className="text-blue-600 hover:underline font-bold">Download Logs</button>
                    <button className="text-red-600 hover:underline font-bold">Emergency Lockdown</button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Shield, Calendar, Sparkles } from 'lucide-react';
import api from '@/lib/api';

interface ActivePass {
    id: string;
    pass: {
        title: string;
        passType: string;
    };
    expiryDate: string;
    status: string;
}

export default function ActivePassBadge() {
    const [activePass, setActivePass] = useState<ActivePass | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivePass();
    }, []);

    const fetchActivePass = async () => {
        try {
            const response = await api.get('/passes/current');
            setActivePass(response.data);
        } catch (error) {
            // No active pass or error
            setActivePass(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (!activePass) return null;

    const expiryDate = new Date(activePass.expiryDate);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
    const isLifetime = activePass.pass.passType === 'LIFETIME';

    return (
        <div className={`relative overflow-hidden rounded-xl p-3 ${isExpiringSoon
            ? 'bg-gradient-to-r from-yellow-600 to-orange-600'
            : 'bg-gradient-to-r from-blue-600 to-purple-600'
            } text-white shadow-lg`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 opacity-10">
                <Sparkles className="w-32 h-32" />
            </div>

            <div className="relative flex items-center gap-3">
                <div className={`p-3 rounded-lg ${isExpiringSoon ? 'bg-white/20' : 'bg-white/20'
                    }`}>
                    <Shield className="w-6 h-6" />
                </div>

                <div className="flex-1">
                    <div className="font-bold text-lg flex items-center gap-2">
                        {activePass.pass.title}
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">
                            ACTIVE
                        </span>
                    </div>
                    <div className="text-sm opacity-90 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {isLifetime ? (
                            <span>Lifetime Access</span>
                        ) : isExpiringSoon ? (
                            <span className="font-semibold">
                                Expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}!
                            </span>
                        ) : (
                            <span>{daysRemaining} days remaining</span>
                        )}
                    </div>
                </div>

                {isExpiringSoon && !isLifetime && (
                    <button className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all">
                        Renew Now
                    </button>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import SubjectRadar from '@/components/analytics/SubjectRadar';
import PerformanceMatrix from '@/components/analytics/PerformanceMatrix';
import PeerRankGauge from '@/components/analytics/PeerRankGauge';
import { BarChart2 } from 'lucide-react';

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null); // matrix, peer, mastery
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const [matrixRes, peerRes, masteryRes] = await Promise.all([
                api.get('/analytics/user/matrix'),
                api.get('/analytics/user/peer'),
                api.get('/analytics/mastery')
            ]);

            setStats({
                matrix: matrixRes.data,
                peer: peerRes.data,
                mastery: masteryRes.data
            });
        } catch (error) {
            console.error('Failed to load analytics', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading Analytics...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-xl">
                    <BarChart2 className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Advanced Analytics</h1>
                    <p className="text-slate-500 font-medium">Deep dive into your performance metrics.</p>
                </div>
            </div>

            {/* Peer & Rank Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <PeerRankGauge data={stats?.peer} />
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <SubjectRadar data={stats?.mastery} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <PerformanceMatrix data={stats?.matrix} />
                </motion.div>
            </div>
        </div>
    );
}

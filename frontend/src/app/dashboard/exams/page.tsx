'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus, Search } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface Exam {
    id: string;
    title: string;
    description: string;
    isPremium: boolean;
    price: number;
    chapters?: any[];
}

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const response = await api.get('/exams');
            setExams(response.data);
        } catch (error) {
            console.error('Failed to fetch exams', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Popular Test Series</h1>
                <p className="text-slate-500 font-medium">Explore our premium collection of mock tests designated for your success.</p>
            </div>

            {/* Search / Filter bar placeholder (optional) */}
            <div className="flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm max-w-md">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input
                    type="text"
                    placeholder="Search for your Exam"
                    className="w-full px-4 py-2 outline-none text-sm font-medium text-slate-700 placeholder-gray-400"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {exams.map((exam, index) => {
                    // MOCKED DATA for visual match (since backend doesn't support these yet)
                    const totalTests = exam.chapters?.reduce((acc: any, ch: any) => acc + (ch.models?.length || 0), 0) || 0;
                    const userCount = Math.floor(Math.random() * 500) + 100 + 'k'; // Mock users
                    const freeTests = Math.floor(Math.random() * 5) + 2; // Mock free count

                    return (
                        <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden"
                        >
                            {/* Top Gradient Line */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div>
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-100 to-rose-50 flex items-center justify-center border border-rose-100 shadow-sm">
                                        <span className="text-2xl">🏛️</span>
                                        {/* Ideally fetch exam.imageUrl here */}
                                    </div>
                                    <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                        <Zap className="w-3 h-3 fill-current" />
                                        <span>{userCount} Users</span>
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold text-slate-900 leading-tight mb-2 min-h-[3rem]">
                                    {exam.title}
                                </h2>

                                <div className="text-xs font-semibold text-slate-500 mb-4 flex gap-2">
                                    <span>{totalTests} Total Tests</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-green-600">{freeTests} Free Tests</span>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                        English
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                        Hindi
                                    </span>
                                    {Math.random() > 0.5 && (
                                        <span className="text-[10px] font-bold text-slate-400">
                                            + 5 More
                                        </span>
                                    )}
                                </div>

                                {/* Features List (Mocked) */}
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                                        <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5"></span>
                                        20 Full Chapter Tests
                                    </li>
                                    <li className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                                        <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5"></span>
                                        15 Previous Year Papers
                                    </li>
                                    <li className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                                        <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5"></span>
                                        30 Sectional Tests
                                    </li>
                                    <li className="text-xs font-bold text-green-600 pl-3">
                                        +{totalTests > 50 ? totalTests - 50 : 10} more tests
                                    </li>
                                </ul>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center gap-3 mt-auto">
                                <Link
                                    href={`/dashboard/exams/${exam.id}`}
                                    className="flex-1 bg-[#00bfa5] hover:bg-[#008f7a] text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-teal-500/20 text-center"
                                >
                                    View Test Series
                                </Link>
                                <button
                                    onClick={() => alert('Feature coming soon: Add to My Collection')}
                                    className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[#00bfa5] transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

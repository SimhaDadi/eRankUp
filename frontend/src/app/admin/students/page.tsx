'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    User,
    GraduationCap,
    Award,
    Eye
} from 'lucide-react';
import api from '@/lib/api';

interface Student {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    totalAttempts: number;
    averageScore: number;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/analytics/students', {
                params: { page, limit: 10, search: debouncedSearch }
            });
            setStudents(res.data.students);
            setTotalPages(Math.ceil(res.data.total / 10));
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Student Monitoring
                    </h1>
                    <p className="text-slate-400 font-medium mt-2">
                        Track progress and performance of individual students
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded-full py-2.5 pl-10 pr-4 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
            </header>

            {/* Students Table */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-medium text-sm uppercase tracking-wider">
                                <th className="p-5">Student</th>
                                <th className="p-5">Joined</th>
                                <th className="p-5 text-center">Exams Taken</th>
                                <th className="p-5 text-center">Avg. Score</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                // Skeleton loading rows
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-5"><div className="h-10 w-40 bg-slate-800 rounded animate-pulse"></div></td>
                                        <td className="p-5"><div className="h-6 w-24 bg-slate-800 rounded animate-pulse"></div></td>
                                        <td className="p-5"><div className="h-6 w-16 bg-slate-800 rounded animate-pulse mx-auto"></div></td>
                                        <td className="p-5"><div className="h-6 w-16 bg-slate-800 rounded animate-pulse mx-auto"></div></td>
                                        <td className="p-5"><div className="h-8 w-20 bg-slate-800 rounded animate-pulse ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                                        {student.fullName}
                                                    </div>
                                                    <div className="text-sm text-slate-500">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-400">
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-5 text-center font-medium text-white">
                                            {student.totalAttempts}
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${student.averageScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                                                    student.averageScore >= 40 ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-red-500/20 text-red-400'
                                                }`}>
                                                {student.averageScore}%
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <Link href={`/admin/students/${student.id}`}>
                                                <button className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                    Details
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-slate-500">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && students.length > 0 && (
                    <div className="border-t border-slate-800 p-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

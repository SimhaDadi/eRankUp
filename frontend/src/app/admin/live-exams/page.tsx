'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    Play,
    CheckCircle,
    BookOpen,
    MoreVertical,
    FileText,
    Upload
} from 'lucide-react';
import api from '@/lib/api';
import UploadExamQuestionsModal from '@/components/admin/UploadExamQuestionsModal';

interface Exam {
    id: string;
    title: string;
    startTime?: string;
    endTime?: string;
    isActive: boolean;
    isPremium: boolean;
}

export default function LiveExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);

    // Scheduling Form State
    const [schedule, setSchedule] = useState({
        startTime: '',
        endTime: ''
    });

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [examToUpload, setExamToUpload] = useState<{ id: string; title: string } | null>(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exams?type=live_exam');
            const data = res.data;
            if (data.data && Array.isArray(data.data)) {
                setExams(data.data);
            } else if (Array.isArray(data)) {
                setExams(data);
            } else {
                setExams([]);
            }
        } catch (error) {
            console.error('Failed to fetch exams', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExam) return;

        try {
            await api.put(`/admin/live-exams/${selectedExam.id}`, {
                startTime: new Date(schedule.startTime).toISOString(),
                endTime: new Date(schedule.endTime).toISOString()
            });

            setIsScheduling(false);
            fetchExams();
            alert('Schedule updated successfully!');
        } catch (error) {
            console.error('Failed to update schedule', error);
            alert('Failed to update schedule');
        }
    };

    const handleExportCSV = async (id: string, title: string) => {
        try {
            const response = await api.get(`/exams/${id}/export/csv`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `live-${title.replace(/\s+/g, '-').toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to export CSV", error);
            alert('Failed to export CSV');
        }
    };

    const openScheduleModal = (exam: Exam) => {
        setSelectedExam(exam);
        setSchedule({
            startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
            endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : ''
        });
        setIsScheduling(true);
    };

    const getStatus = (exam: Exam) => {
        if (!exam.startTime || !exam.endTime) return 'unscheduled';
        const now = new Date();
        const start = new Date(exam.startTime);
        const end = new Date(exam.endTime);

        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'live';
        return 'completed';
    };

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Live Exam Scheduling
                </h1>
                <p className="text-slate-400 font-medium mt-2">
                    Schedule exams for specific dates and times to create live events
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-slate-900/40 rounded-3xl animate-pulse"></div>
                    ))
                ) : exams.length > 0 ? (
                    exams.map((exam) => {
                        const status = getStatus(exam);
                        return (
                            <motion.div
                                key={exam.id}
                                whileHover={{ y: -5 }}
                                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl relative overflow-hidden group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleExportCSV(exam.id, exam.title)}
                                            className="p-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                                            title="Export Question Paper (CSV)"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setExamToUpload({ id: exam.id, title: exam.title });
                                                setShowUploadModal(true);
                                            }}
                                            className="p-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                                            title="Upload Questions"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                        <div className={`p-3 rounded-2xl ${status === 'live' ? 'bg-red-500/10 text-red-500 animate-pulse' :
                                            status === 'upcoming' ? 'bg-blue-500/10 text-blue-500' :
                                                status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'
                                            }`}>
                                            {status === 'live' ? <Play className="w-6 h-6" /> :
                                                status === 'upcoming' ? <Calendar className="w-6 h-6" /> :
                                                    status === 'completed' ? <CheckCircle className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${status === 'live' ? 'bg-red-500 text-white' :
                                        status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                                            status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                        {status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{exam.title}</h3>

                                {exam.startTime && exam.endTime ? (
                                    <div className="space-y-2 text-sm text-slate-400 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            Start: {new Date(exam.startTime).toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            End: {new Date(exam.endTime).toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-600 italic mb-6">
                                        No schedule set
                                    </div>
                                )}

                                <button
                                    onClick={() => openScheduleModal(exam)}
                                    className="w-full py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                                >
                                    {status === 'unscheduled' ? 'Set Schedule' : 'Update Schedule'}
                                </button>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-20 text-slate-500">
                        No exams found to schedule.
                    </div>
                )}
            </div>

            {/* Scheduling Modal */}
            {isScheduling && selectedExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0c111d] border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-xl font-bold text-white mb-1">Schedule Exam</h2>
                        <p className="text-slate-400 text-sm mb-6">{selectedExam.title}</p>

                        <form onSubmit={handleSchedule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Start Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    value={schedule.startTime}
                                    onChange={e => setSchedule({ ...schedule, startTime: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">End Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                                    value={schedule.endTime}
                                    onChange={e => setSchedule({ ...schedule, endTime: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduling(false)}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                                >
                                    Save Schedule
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {showUploadModal && examToUpload && (
                <UploadExamQuestionsModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setExamToUpload(null);
                    }}
                    onSuccess={() => {
                        fetchExams();
                        setShowUploadModal(false);
                        setExamToUpload(null);
                    }}
                    examId={examToUpload.id}
                    examTitle={examToUpload.title}
                />
            )}
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Question } from './types';
import EditQuestionModal from '../EditQuestionModal';

export default function QuestionListTab() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.topic = searchQuery;
            if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

            const response = await api.get('/exams/questions/global', { params });
            // Handle both array (legacy) and paginated object responses
            const data = response.data.questions || response.data;
            setQuestions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load questions", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedDifficulty]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-3xl">
                <div className="mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="py-12 text-center text-slate-500">Loading questions...</div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <p className="text-lg font-medium">No questions found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {questions.map((q) => (
                                <div key={q.id} className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <p className="text-white font-medium mb-2">{q.content}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {q.exams?.map(ex => (
                                                    <span key={ex.id} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] uppercase font-bold">
                                                        {ex.title}
                                                    </span>
                                                ))}
                                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[10px] uppercase font-bold">
                                                    {q.topic}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingQuestion(q)}
                                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to delete this question?')) {
                                                        try {
                                                            await api.delete(`/questions/${q.id}`);
                                                            fetchQuestions();
                                                        } catch (e) {
                                                            alert('Failed to delete question');
                                                        }
                                                    }
                                                }}
                                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {editingQuestion && (
                <EditQuestionModal
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    onSuccess={() => {
                        fetchQuestions();
                        setEditingQuestion(null);
                    }}
                    question={editingQuestion}
                />
            )}
        </motion.div>
    );
}

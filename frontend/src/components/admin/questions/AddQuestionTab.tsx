import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { Exam, Subject, Chapter } from './types';

export default function AddQuestionTab() {
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [loadingExams, setLoadingExams] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        questionText: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correctAnswer: 0,
        topic: '',
        difficulty: 'medium',
        subjectId: '',
        chapterId: '',
        explanation: ''
    });

    const fetchExams = useCallback(async () => {
        setLoadingExams(true);
        setError(null);
        try {
            const response = await api.get('/exams');
            // Handle pagination wrapper { data: [], meta: {} } vs direct array []
            const data = response.data;
            setExams(Array.isArray(data) ? data : (data.data || []));
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to load exams';
            setError(message);
            console.error('Error fetching exams:', error);
        } finally {
            setLoadingExams(false);
        }
    }, []);

    const fetchSubjects = useCallback(async (examId: string) => {
        setLoadingSubjects(true);
        setError(null);
        try {
            const response = await api.get(`/subjects/by-exam/${examId}`);
            setSubjects(response.data);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to load subjects';
            setError(message);
            console.error('Error fetching subjects:', error);
        } finally {
            setLoadingSubjects(false);
        }
    }, []);

    const fetchChapters = useCallback(async (subjectId: string) => {
        setLoadingChapters(true);
        setError(null);
        try {
            const response = await api.get(`/chapters/by-subject/${subjectId}`);
            setChapters(response.data);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to load chapters';
            setError(message);
            console.error('Error fetching chapters:', error);
        } finally {
            setLoadingChapters(false);
        }
    }, []);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    useEffect(() => {
        if (selectedExamId) {
            fetchSubjects(selectedExamId);
        } else {
            setSubjects([]);
            setChapters([]);
        }
    }, [selectedExamId, fetchSubjects]);

    useEffect(() => {
        if (selectedSubjectId) {
            fetchChapters(selectedSubjectId);
        } else {
            setChapters([]);
        }
    }, [selectedSubjectId, fetchChapters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const questionData = {
                questionText: formData.questionText,
                options: [formData.option1, formData.option2, formData.option3, formData.option4],
                correctAnswer: formData.correctAnswer,
                topic: formData.topic,
                difficulty: formData.difficulty,
                subjectId: formData.subjectId,
                exams: selectedExamId ? [{ id: selectedExamId }] : [],
                chapterId: formData.chapterId,
                explanation: formData.explanation
            };

            await api.post('/questions', questionData);

            // Success - reset form
            setFormData({
                questionText: '',
                option1: '',
                option2: '',
                option3: '',
                option4: '',
                correctAnswer: 0,
                topic: '',
                difficulty: 'medium',
                subjectId: '',
                chapterId: '',
                explanation: ''
            });
            setSelectedExamId('');
            setSelectedSubjectId('');

            // Show success message
            alert('Question added successfully!');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to add question';
            setError(message);
            console.error('Error adding question:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-3xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 text-sm">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Question Text */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                            Question Text *
                        </label>
                        <textarea
                            required
                            value={formData.questionText}
                            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="Enter the question text..."
                        />
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((num) => (
                            <div key={num}>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Option {num} *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData[`option${num}` as keyof typeof formData]}
                                    onChange={(e) => setFormData({ ...formData, [`option${num}`]: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                                    placeholder={`Enter option ${num}...`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Correct Answer */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Correct Answer *
                        </label>
                        <select
                            required
                            value={formData.correctAnswer}
                            onChange={(e) => setFormData({ ...formData, correctAnswer: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        >
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={0}>Option 1</option>
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={1}>Option 2</option>
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={2}>Option 3</option>
                            <option style={{ backgroundColor: '#020617', color: 'white' }} value={3}>Option 4</option>
                        </select>
                    </div>

                    {/* Hierarchy Selectors */}
                    <div className="space-y-6">


                        {/* Hierarchy Context (for Subject/Chapter selection) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Hierarchy Context (Exam Pool) *</label>
                                <select
                                    required
                                    value={selectedExamId}
                                    onChange={(e) => {
                                        setSelectedExamId(e.target.value);
                                        setFormData({ ...formData, subjectId: '', chapterId: '' });
                                        setSelectedSubjectId('');
                                    }}
                                    disabled={loadingExams}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    style={{ backgroundColor: '#020617', color: 'white' }}
                                >
                                    <option style={{ backgroundColor: '#020617', color: 'white' }} value="">Select Exam for Pool</option>
                                    {exams.map(exam => (
                                        <option style={{ backgroundColor: '#020617', color: 'white' }} key={exam.id} value={exam.id}>{exam.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Subject *</label>
                                <select
                                    required
                                    value={selectedSubjectId}
                                    onChange={(e) => {
                                        setSelectedSubjectId(e.target.value);
                                        setFormData({ ...formData, subjectId: e.target.value, chapterId: '' });
                                    }}
                                    disabled={!selectedExamId || loadingSubjects}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    style={{ backgroundColor: '#020617', color: 'white' }}
                                >
                                    <option style={{ backgroundColor: '#020617', color: 'white' }} value="">{loadingSubjects ? 'Loading...' : 'Select Subject'}</option>
                                    {subjects.map(subject => (
                                        <option style={{ backgroundColor: '#020617', color: 'white' }} key={subject.id} value={subject.id}>{subject.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Chapter *</label>
                                <select
                                    required
                                    value={formData.chapterId}
                                    onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                                    disabled={!selectedSubjectId || loadingChapters}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    style={{ backgroundColor: '#020617', color: 'white' }}
                                >
                                    <option style={{ backgroundColor: '#020617', color: 'white' }} value="">{loadingChapters ? 'Loading...' : 'Select Chapter'}</option>
                                    {chapters.map(chapter => (
                                        <option style={{ backgroundColor: '#020617', color: 'white' }} key={chapter.id} value={chapter.id}>{chapter.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Topic & Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Topic *</label>
                            <input
                                required
                                type="text"
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                                placeholder="e.g., Algebra, Grammar, etc."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Difficulty *</label>
                            <select
                                required
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            >
                                <option style={{ backgroundColor: '#020617', color: 'white' }} value="easy">Easy</option>
                                <option style={{ backgroundColor: '#020617', color: 'white' }} value="medium">Medium</option>
                                <option style={{ backgroundColor: '#020617', color: 'white' }} value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Explanation (Optional)
                        </label>
                        <textarea
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            placeholder="Explain the correct answer..."
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Add Question
                            </>
                        )}
                    </button>
                </form>
            </div>
        </motion.div>
    );
}

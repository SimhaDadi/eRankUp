import { useState, useEffect } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import api from '@/lib/api';

interface Subject {
    id: string;
    title: string;
}

interface SectionManagerProps {
    examId: string;
    onSectionsChange?: (subjects: Subject[]) => void;
}

export default function SectionManager({ examId, onSectionsChange }: SectionManagerProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, [examId]);

    const fetchSubjects = async () => {
        try {
            setIsLoading(true);
            const res = await api.get(`/exams/${examId}/subjects`);
            setSubjects(res.data || []);
            onSectionsChange?.(res.data || []);
        } catch (e) {
            console.error('Failed to fetch subjects', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newTitle.trim()) return;
        try {
            setIsAdding(true);
            setError('');
            await api.post('/exams/subjects', { title: newTitle.trim(), examId });
            setNewTitle('');
            await fetchSubjects();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to add section');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this section? Questions tagged to it will lose their section assignment.')) return;
        try {
            await api.delete(`/exams/subjects/${id}`);
            await fetchSubjects();
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to delete section');
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Sections / Subjects</h3>
                <span className="ml-auto text-xs text-slate-500">{subjects.length} section{subjects.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Existing Sections */}
            {isLoading ? (
                <div className="text-xs text-slate-500 py-2">Loading...</div>
            ) : subjects.length === 0 ? (
                <div className="text-xs text-slate-500 py-2">No sections yet. Add sections to enable section-wise scoring.</div>
            ) : (
                <ul className="space-y-2 mb-4">
                    {subjects.map((s) => (
                        <li key={s.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                            <span className="text-sm text-slate-200 font-medium">{s.title}</span>
                            <button
                                onClick={() => handleDelete(s.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                                title="Delete section"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Add New */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="e.g. Mathematics, Reasoning..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                    onClick={handleAdd}
                    disabled={isAdding || !newTitle.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {isAdding ? 'Adding...' : 'Add'}
                </button>
            </div>

            {error && (
                <p className="text-xs text-rose-400 mt-2">{error}</p>
            )}
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle, XCircle, BookOpen, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';

interface ExplanationCardProps {
    explanation: string;
    questionId: string;
    questionText?: string;
    correctAnswer?: string;
}

export function ExplanationCard({ explanation, questionId, questionText, correctAnswer }: ExplanationCardProps) {
    const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    if (!explanation || explanation === 'No explanation available yet.') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 text-slate-400">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm">No explanation available for this question yet.</p>
                </div>
            </motion.div>
        );
    }

    // Parse explanation sections (AI generates structured format)
    const sections = parseExplanation(explanation);

    const handleFeedback = async (helpful: boolean) => {
        if (submittingFeedback) return;

        setSubmittingFeedback(true);
        try {
            await api.post(`/explanations/${questionId}/feedback`, { helpful });
            setFeedback(helpful ? 'helpful' : 'not_helpful');
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Solution</h3>
                </div>

                {/* Feedback Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleFeedback(true)}
                        disabled={submittingFeedback || feedback !== null}
                        className={`p-2 rounded-lg transition-all ${feedback === 'helpful'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Helpful"
                    >
                        <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleFeedback(false)}
                        disabled={submittingFeedback || feedback !== null}
                        className={`p-2 rounded-lg transition-all ${feedback === 'not_helpful'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-red-500/10 hover:text-red-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Not Helpful"
                    >
                        <ThumbsDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {sections.whyCorrect && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-emerald-400 mb-2">Why it's correct</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{sections.whyCorrect}</p>
                            </div>
                        </div>
                    </div>
                )}

                {sections.whyWrong && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-red-400 mb-2">Why others are wrong</h4>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{sections.whyWrong}</p>
                            </div>
                        </div>
                    </div>
                )}

                {sections.keyConcept && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-purple-400 mb-2">Key Concept</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{sections.keyConcept}</p>
                            </div>
                        </div>
                    </div>
                )}

                {sections.commonMistake && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-amber-400 mb-2">Common Mistake</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{sections.commonMistake}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fallback: show raw explanation if parsing fails */}
                {!sections.whyCorrect && !sections.whyWrong && !sections.keyConcept && !sections.commonMistake && (
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {explanation}
                    </div>
                )}
            </div>

            {/* Feedback confirmation */}
            {feedback && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-xs text-slate-400 text-center"
                >
                    Thanks for your feedback! 🙏
                </motion.div>
            )}
        </motion.div>
    );
}

// Helper function to parse AI-generated explanation
function parseExplanation(explanation: string) {
    const sections = {
        whyCorrect: '',
        whyWrong: '',
        keyConcept: '',
        commonMistake: ''
    };

    // Try to parse structured format
    const whyCorrectMatch = explanation.match(/\*\*Why it's correct\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    const whyWrongMatch = explanation.match(/\*\*Why others are wrong\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    const keyConceptMatch = explanation.match(/\*\*Key concept\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    const commonMistakeMatch = explanation.match(/\*\*Common mistake\*\*:?\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);

    if (whyCorrectMatch) sections.whyCorrect = whyCorrectMatch[1].trim();
    if (whyWrongMatch) sections.whyWrong = whyWrongMatch[1].trim();
    if (keyConceptMatch) sections.keyConcept = keyConceptMatch[1].trim();
    if (commonMistakeMatch) sections.commonMistake = commonMistakeMatch[1].trim();

    return sections;
}

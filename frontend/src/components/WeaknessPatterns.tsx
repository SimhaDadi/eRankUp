'use client';

import { motion } from 'framer-motion';
import { Clock, BookOpen, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';

export interface MistakePattern {
    type: 'time_pressure' | 'concept_gap' | 'careless_mistake' | 'difficulty_mismatch';
    frequency: number;
    affectedTopics: string[];
    affectedChapters: string[];
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
    details?: any;
}

interface WeaknessPatternsProps {
    patterns: MistakePattern[];
}

export function WeaknessPatterns({ patterns }: WeaknessPatternsProps) {
    if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-8 text-center"
            >
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Patterns Detected</h3>
                <p className="text-slate-400 text-sm">
                    Great! We haven't detected any recurring weakness patterns. Keep up the good work!
                </p>
            </motion.div>
        );
    }

    const getPatternConfig = (type: string) => {
        const configs = {
            time_pressure: {
                icon: Clock,
                color: 'red',
                title: 'Time Pressure',
                emoji: '⏱️'
            },
            concept_gap: {
                icon: BookOpen,
                color: 'orange',
                title: 'Concept Gap',
                emoji: '📚'
            },
            careless_mistake: {
                icon: AlertTriangle,
                color: 'yellow',
                title: 'Careless Mistakes',
                emoji: '⚠️'
            },
            difficulty_mismatch: {
                icon: TrendingUp,
                color: 'blue',
                title: 'Difficulty Mismatch',
                emoji: '📈'
            }
        };
        return configs[type as keyof typeof configs] || configs.concept_gap;
    };

    const getSeverityColor = (severity: string) => {
        const colors = {
            high: 'border-red-500/50 bg-red-500/10',
            medium: 'border-orange-500/50 bg-orange-500/10',
            low: 'border-yellow-500/50 bg-yellow-500/10'
        };
        return colors[severity as keyof typeof colors] || colors.medium;
    };

    const getSeverityBadge = (severity: string) => {
        const badges = {
            high: 'bg-red-500/20 text-red-400 border-red-500/30',
            medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            low: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
        return badges[severity as keyof typeof badges] || badges.medium;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Weakness Patterns</h2>
                <p className="text-slate-400 text-sm">
                    We've analyzed your performance and identified {patterns.length} pattern{patterns.length > 1 ? 's' : ''} that need attention.
                </p>
            </div>

            {/* Patterns List */}
            <div className="space-y-4">
                {patterns.map((pattern, index) => {
                    const config = getPatternConfig(pattern.type);
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`border-l-4 ${getSeverityColor(pattern.severity)} backdrop-blur-sm rounded-xl p-6`}
                        >
                            {/* Pattern Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 bg-${config.color}-500/20 rounded-lg`}>
                                        <Icon className={`w-5 h-5 text-${config.color}-400`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{config.emoji}</span>
                                            <h3 className="font-bold text-white">{config.title}</h3>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Detected in {pattern.frequency}% of questions
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityBadge(pattern.severity)}`}>
                                    {pattern.severity.toUpperCase()}
                                </span>
                            </div>

                            {/* Affected Areas */}
                            {pattern.affectedTopics.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-slate-400 mb-2">Affected Topics:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {pattern.affectedTopics.map((topic, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-300"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendation */}
                            <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-emerald-400 text-sm mb-1">Recommendation</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            {pattern.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Details */}
                            {pattern.details && (
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        {Object.entries(pattern.details).map(([key, value]) => (
                                            <div key={key}>
                                                <span className="text-slate-500 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                                </span>
                                                <span className="text-slate-300 ml-2 font-medium">
                                                    {typeof value === 'number' ? value : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-400 text-sm mb-1">Next Steps</h4>
                        <p className="text-sm text-slate-300">
                            Focus on addressing high-severity patterns first. Practice targeted questions in your weak areas
                            and track your improvement over time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

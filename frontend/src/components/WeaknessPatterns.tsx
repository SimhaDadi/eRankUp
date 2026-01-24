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
                className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center shadow-sm"
            >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Patterns Detected</h3>
                <p className="text-slate-500 font-medium">
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
                description: 'Struggling with time management',
            },
            concept_gap: {
                icon: BookOpen,
                color: 'orange',
                title: 'Concept Gap',
                description: 'Missing fundamental understanding',
            },
            careless_mistake: {
                icon: AlertTriangle,
                color: 'amber',
                title: 'Careless Mistakes',
                description: 'Avoidable errors in calculation/reading',
            },
            difficulty_mismatch: {
                icon: TrendingUp,
                color: 'blue',
                title: 'Difficulty Mismatch',
                description: 'Struggling with higher complexity',
            }
        };
        return configs[type as keyof typeof configs] || configs.concept_gap;
    };

    const getSeverityStyles = (severity: string) => {
        const styles = {
            high: 'bg-red-50 text-red-600 border-red-100 ring-red-500/20',
            medium: 'bg-orange-50 text-orange-600 border-orange-100 ring-orange-500/20',
            low: 'bg-yellow-50 text-yellow-600 border-yellow-100 ring-yellow-500/20'
        };
        return styles[severity as keyof typeof styles] || styles.medium;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-1 rounded-full bg-slate-200"></div>
                <h2 className="text-2xl font-black text-slate-900">Weakness Analysis</h2>
                <div className="w-full h-px bg-slate-100"></div>
            </div>

            {/* Patterns List */}
            <div className="grid grid-cols-1 gap-6">
                {patterns.map((pattern, index) => {
                    const config = getPatternConfig(pattern.type);
                    const Icon = config.icon;
                    const colorClass = config.color === 'red' ? 'text-red-500 bg-red-50' :
                        config.color === 'orange' ? 'text-orange-500 bg-orange-50' :
                            config.color === 'amber' ? 'text-amber-500 bg-amber-50' :
                                'text-blue-500 bg-blue-50';

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                            {/* Decorative gradien t */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-${config.color}-500/5 rounded-bl-[4rem] -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-150 duration-700 ease-out`} />

                            <div className="relative z-10">
                                {/* Header Row */}
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                    <div className="flex items-start gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 mb-1">{config.title}</h3>
                                            <p className="text-slate-500 font-medium text-sm">{config.description}</p>

                                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                                <TrendingUp className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600">Detected in {pattern.frequency}% of questions</span>
                                            </div>
                                        </div>
                                    </div>

                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ring-1 ${getSeverityStyles(pattern.severity)}`}>
                                        {pattern.severity} Severity
                                    </span>
                                </div>

                                {/* Content Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: Recommendation */}
                                    <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 relative group-hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                <Lightbulb className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Recommendation</div>
                                                <p className="text-slate-700 leading-relaxed font-medium">
                                                    {pattern.recommendation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Affected Areas & Details */}
                                    <div className="space-y-6">
                                        {pattern.affectedTopics.length > 0 && (
                                            <div>
                                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Affected Topics</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {pattern.affectedTopics.map((topic, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm"
                                                        >
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {pattern.details && (
                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(pattern.details).map(([key, value]) => (
                                                        <div key={key}>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </div>
                                                            <div className="text-slate-800 font-bold">
                                                                {typeof value === 'number' ? value : String(value)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">Improvement Strategy</h4>
                    <p className="text-slate-600 font-medium">
                        Focus on addressing <span className="text-red-500 font-bold">High Severity</span> patterns first.
                        Targeted practice on the listed topics is recommended to boost your score by up to 15%.
                    </p>
                </div>
            </div>
        </div>
    );
}

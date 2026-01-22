'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface TopicRecommendation {
    topic: string;
    priority: number;
    reason: string;
    estimatedTime: number;
}

interface LearningPath {
    recommendedTopics: TopicRecommendation[];
    weakAreas: string[];
    strongAreas: string[];
    generatedAt: string;
}

export default function LearningPathTimeline() {
    const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLearningPath();
    }, []);

    const fetchLearningPath = async () => {
        try {
            const response = await api.get('/adaptive/learning-path');
            setLearningPath(response.data);
        } catch (error) {
            console.error('Failed to fetch learning path', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: number) => {
        if (priority >= 8) return 'from-red-500 to-orange-500';
        if (priority >= 5) return 'from-yellow-500 to-orange-500';
        return 'from-blue-500 to-purple-500';
    };

    const getPriorityLabel = (priority: number) => {
        if (priority >= 8) return 'High Priority';
        if (priority >= 5) return 'Medium Priority';
        return 'Low Priority';
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">🗺️ Your Learning Path</h2>
                <p className="text-slate-400 text-sm">AI-generated personalized study plan</p>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8">Generating your learning path...</div>
            ) : !learningPath || learningPath.recommendedTopics.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                    <p>Complete some tests to generate your personalized learning path</p>
                </div>
            ) : (
                <div>
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
                            <div className="text-red-400 text-sm font-semibold mb-1">Weak Areas</div>
                            <div className="text-white text-lg font-bold">{learningPath.weakAreas.length} topics</div>
                        </div>
                        <div className="bg-green-500/20 border border-green-500 rounded-xl p-4">
                            <div className="text-green-400 text-sm font-semibold mb-1">Strong Areas</div>
                            <div className="text-white text-lg font-bold">{learningPath.strongAreas.length} topics</div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700"></div>

                        <div className="space-y-6">
                            {learningPath.recommendedTopics.map((topic, index) => (
                                <motion.div
                                    key={topic.topic}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative pl-16"
                                >
                                    {/* Timeline Dot */}
                                    <div
                                        className={`absolute left-3 w-6 h-6 rounded-full bg-gradient-to-br ${getPriorityColor(
                                            topic.priority
                                        )} border-4 border-slate-900`}
                                    ></div>

                                    {/* Content Card */}
                                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-white font-bold text-lg">{topic.topic}</h3>
                                                <p className="text-slate-400 text-sm mt-1">{topic.reason}</p>
                                            </div>
                                            <div
                                                className={`bg-gradient-to-r ${getPriorityColor(
                                                    topic.priority
                                                )} text-white text-xs px-3 py-1 rounded-full font-bold`}
                                            >
                                                {getPriorityLabel(topic.priority)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-3 text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span>⏱️</span>
                                                <span>{topic.estimatedTime} minutes</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span>📊</span>
                                                <span>Priority: {topic.priority}/10</span>
                                            </div>
                                        </div>

                                        <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all">
                                            Start Practice
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Generated on {new Date(learningPath.generatedAt).toLocaleDateString()} • Updates weekly
                    </div>
                </div>
            )}
        </div>
    );
}

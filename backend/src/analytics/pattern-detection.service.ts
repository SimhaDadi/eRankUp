import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt } from '../exams/entities/attempt.entity';
import { Response } from '../exams/entities/response.entity';

export interface MistakePattern {
    type: 'time_pressure' | 'concept_gap' | 'careless_mistake' | 'difficulty_mismatch';
    frequency: number;
    affectedTopics: string[];
    affectedChapters: string[];
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
    details?: any;
}

@Injectable()
export class PatternDetectionService {
    constructor(
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Response)
        private responseRepository: Repository<Response>,
    ) { }

    async detectPatterns(userId: string): Promise<MistakePattern[]> {
        const attempts = await this.attemptRepository.find({
            where: { user: { id: userId } },
            relations: ['responses', 'responses.question', 'responses.question.chapter'],
            order: { createdAt: 'DESC' },
            take: 20 // Last 20 attempts for analysis
        });

        if (attempts.length === 0) {
            return [];
        }

        const patterns: MistakePattern[] = [];

        // Pattern 1: Time Pressure (mistakes in last 20% of exam)
        const timePressurePattern = this.detectTimePressure(attempts);
        if (timePressurePattern) patterns.push(timePressurePattern);

        // Pattern 2: Concept Gap (consistent errors on specific topics)
        const conceptGaps = this.detectConceptGaps(attempts);
        patterns.push(...conceptGaps);

        // Pattern 3: Careless Mistakes (wrong on easy questions)
        const carelessPattern = this.detectCarelessMistakes(attempts);
        if (carelessPattern) patterns.push(carelessPattern);

        // Pattern 4: Difficulty Mismatch (struggling with hard questions)
        const difficultyPattern = this.detectDifficultyMismatch(attempts);
        if (difficultyPattern) patterns.push(difficultyPattern);

        return patterns.sort((a, b) => b.frequency - a.frequency);
    }

    private detectTimePressure(attempts: Attempt[]): MistakePattern | null {
        let lastQuarterMistakes = 0;
        let totalLastQuarter = 0;
        let firstThreeQuartersMistakes = 0;
        let totalFirstThreeQuarters = 0;

        for (const attempt of attempts) {
            if (!attempt.responses || attempt.responses.length === 0) continue;

            const totalQuestions = attempt.responses.length;
            const lastQuarterStart = Math.floor(totalQuestions * 0.75);

            const lastQuarterResponses = attempt.responses.slice(lastQuarterStart);
            const firstThreeQuartersResponses = attempt.responses.slice(0, lastQuarterStart);

            totalLastQuarter += lastQuarterResponses.length;
            lastQuarterMistakes += lastQuarterResponses.filter(r => !r.isCorrect).length;

            totalFirstThreeQuarters += firstThreeQuartersResponses.length;
            firstThreeQuartersMistakes += firstThreeQuartersResponses.filter(r => !r.isCorrect).length;
        }

        if (totalLastQuarter === 0) return null;

        const lastQuarterErrorRate = lastQuarterMistakes / totalLastQuarter;
        const firstThreeQuartersErrorRate = totalFirstThreeQuarters > 0
            ? firstThreeQuartersMistakes / totalFirstThreeQuarters
            : 0;

        // Time pressure detected if error rate in last quarter is significantly higher
        if (lastQuarterErrorRate > 0.5 && lastQuarterErrorRate > firstThreeQuartersErrorRate + 0.15) {
            return {
                type: 'time_pressure',
                frequency: Math.round(lastQuarterErrorRate * 100),
                affectedTopics: ['All topics'],
                affectedChapters: [],
                recommendation: 'Practice time management. Try solving questions faster in practice mode. Consider skipping difficult questions and returning to them later.',
                severity: lastQuarterErrorRate > 0.7 ? 'high' : 'medium',
                details: {
                    lastQuarterErrorRate: Math.round(lastQuarterErrorRate * 100),
                    overallErrorRate: Math.round(firstThreeQuartersErrorRate * 100)
                }
            };
        }

        return null;
    }

    private detectConceptGaps(attempts: Attempt[]): MistakePattern[] {
        const topicErrors = new Map<string, { wrong: number; total: number; chapters: Set<string> }>();

        for (const attempt of attempts) {
            if (!attempt.responses) continue;

            for (const response of attempt.responses) {
                if (!response.question) continue;

                const topic = response.question.topic || 'General';
                const chapter = response.question.chapter?.title || 'Unknown';
                const stats = topicErrors.get(topic) || { wrong: 0, total: 0, chapters: new Set<string>() };

                stats.total++;
                if (!response.isCorrect) stats.wrong++;
                stats.chapters.add(chapter);

                topicErrors.set(topic, stats);
            }
        }

        const patterns: MistakePattern[] = [];

        topicErrors.forEach((stats, topic) => {
            const errorRate = stats.wrong / stats.total;

            // Only report if significant sample size and high error rate
            if (errorRate > 0.6 && stats.total >= 5) {
                patterns.push({
                    type: 'concept_gap',
                    frequency: Math.round(errorRate * 100),
                    affectedTopics: [topic],
                    affectedChapters: Array.from(stats.chapters),
                    recommendation: `Focus on ${topic}. Review fundamentals, watch tutorial videos, and practice more questions on this topic.`,
                    severity: errorRate > 0.8 ? 'high' : errorRate > 0.7 ? 'medium' : 'low',
                    details: {
                        totalAttempts: stats.total,
                        wrongAnswers: stats.wrong
                    }
                });
            }
        });

        return patterns;
    }

    private detectCarelessMistakes(attempts: Attempt[]): MistakePattern | null {
        let easyQuestionErrors = 0;
        let totalEasyQuestions = 0;
        const affectedTopics = new Set<string>();

        for (const attempt of attempts) {
            if (!attempt.responses) continue;

            for (const response of attempt.responses) {
                if (!response.question) continue;

                // Easy questions have difficulty < 0.4
                if (response.question.difficultyWeight < 0.4) {
                    totalEasyQuestions++;
                    if (!response.isCorrect) {
                        easyQuestionErrors++;
                        affectedTopics.add(response.question.topic || 'General');
                    }
                }
            }
        }

        if (totalEasyQuestions === 0) return null;

        const errorRate = easyQuestionErrors / totalEasyQuestions;

        if (errorRate > 0.25) {
            return {
                type: 'careless_mistake',
                frequency: Math.round(errorRate * 100),
                affectedTopics: Array.from(affectedTopics),
                affectedChapters: [],
                recommendation: 'Slow down and read questions carefully. Double-check easy questions before submitting. Avoid rushing through simple problems.',
                severity: errorRate > 0.4 ? 'high' : 'medium',
                details: {
                    easyQuestionsAttempted: totalEasyQuestions,
                    easyQuestionsMissed: easyQuestionErrors
                }
            };
        }

        return null;
    }

    private detectDifficultyMismatch(attempts: Attempt[]): MistakePattern | null {
        let hardQuestionErrors = 0;
        let totalHardQuestions = 0;
        let mediumQuestionErrors = 0;
        let totalMediumQuestions = 0;

        for (const attempt of attempts) {
            if (!attempt.responses) continue;

            for (const response of attempt.responses) {
                if (!response.question) continue;

                // Hard questions have difficulty > 0.7
                if (response.question.difficultyWeight > 0.7) {
                    totalHardQuestions++;
                    if (!response.isCorrect) hardQuestionErrors++;
                }
                // Medium questions 0.4-0.7
                else if (response.question.difficultyWeight >= 0.4) {
                    totalMediumQuestions++;
                    if (!response.isCorrect) mediumQuestionErrors++;
                }
            }
        }

        if (totalHardQuestions === 0) return null;

        const hardErrorRate = hardQuestionErrors / totalHardQuestions;
        const mediumErrorRate = totalMediumQuestions > 0
            ? mediumQuestionErrors / totalMediumQuestions
            : 0;

        // Difficulty mismatch if struggling significantly more on hard questions
        if (hardErrorRate > 0.7 && hardErrorRate > mediumErrorRate + 0.2) {
            return {
                type: 'difficulty_mismatch',
                frequency: Math.round(hardErrorRate * 100),
                affectedTopics: ['Advanced topics'],
                affectedChapters: [],
                recommendation: 'Build stronger foundation before attempting difficult questions. Focus on medium-difficulty questions first, then gradually increase difficulty.',
                severity: 'medium',
                details: {
                    hardQuestionErrorRate: Math.round(hardErrorRate * 100),
                    mediumQuestionErrorRate: Math.round(mediumErrorRate * 100)
                }
            };
        }

        return null;
    }
}

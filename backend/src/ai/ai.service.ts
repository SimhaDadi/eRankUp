import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../exams/entities/question.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Subject } from '../exams/entities/subject.entity';
import { Chapter } from '../exams/entities/chapter.entity';

interface QuestionScore {
    question: Question;
    score: number;
    reasons: string[];
}

export interface MasteryReport {
    subjectId: string;
    subjectTitle: string;
    chapterId: string;
    chapterTitle: string;
    masteryScore: number;
    totalAttempts: number;
    correctAttempts: number;
    averageDifficulty: number;
    recommendation: string;
}

@Injectable()
export class AIService {
    constructor(
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Subject)
        private subjectRepository: Repository<Subject>,
        @InjectRepository(Chapter)
        private chapterRepository: Repository<Chapter>,
    ) { }

    /**
     * Smart Question Selector - Recommends personalized questions for a user
     * Uses multi-factor scoring: performance history, difficulty progression, topic coverage, recency
     */
    async recommendQuestions(
        userId: string,
        count: number = 20,
        subjectId?: string,
        chapterId?: string
    ): Promise<Question[]> {
        // Get user's attempt history with responses
        const userAttempts = await this.attemptRepository.find({
            where: { user: { id: userId } },
            relations: ['responses', 'responses.question', 'responses.question.subject', 'responses.question.chapter'],
            order: { createdAt: 'DESC' },
            take: 50 // Last 50 attempts for analysis
        });

        // Extract attempted question IDs and performance data
        const attemptedQuestionIds = new Set<string>();
        const performanceByChapter = new Map<string, { correct: number; total: number }>();

        for (const attempt of userAttempts) {
            if (!attempt.responses) continue;

            for (const response of attempt.responses) {
                if (!response.question) continue;

                attemptedQuestionIds.add(response.question.id);

                const chapterId = response.question.chapter?.id || 'unknown';
                const existing = performanceByChapter.get(chapterId) || { correct: 0, total: 0 };
                existing.total++;

                if (response.isCorrect) {
                    existing.correct++;
                }
                performanceByChapter.set(chapterId, existing);
            }
        }

        // Build query for candidate questions
        const queryBuilder = this.questionRepository
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.subject', 'subject')
            .leftJoinAndSelect('question.chapter', 'chapter')
            .leftJoinAndSelect('question.models', 'models');

        if (subjectId) {
            queryBuilder.andWhere('subject.id = :subjectId', { subjectId });
        }
        if (chapterId) {
            queryBuilder.andWhere('chapter.id = :chapterId', { chapterId });
        }

        // Exclude recently attempted questions (last 30)
        const recentlyAttempted = Array.from(attemptedQuestionIds).slice(0, 30);
        if (recentlyAttempted.length > 0) {
            queryBuilder.andWhere('question.id NOT IN (:...recentIds)', { recentIds: recentlyAttempted });
        }

        const candidateQuestions = await queryBuilder.getMany();

        // Score each question
        const scoredQuestions: QuestionScore[] = candidateQuestions.map(question => {
            let score = 0;
            const reasons: string[] = [];

            // Factor 1: Chapter performance (prioritize weak areas)
            const chapterPerf = performanceByChapter.get(question.chapter?.id || '');
            if (chapterPerf) {
                const successRate = chapterPerf.correct / chapterPerf.total;
                if (successRate < 0.5) {
                    score += 30; // High priority for weak chapters
                    reasons.push('Weak chapter');
                } else if (successRate < 0.7) {
                    score += 15;
                    reasons.push('Moderate chapter');
                }
            } else {
                score += 20; // New chapter - medium priority
                reasons.push('Unexplored chapter');
            }

            // Factor 2: Question difficulty (adaptive progression)
            const userLevel = this.estimateUserLevel(performanceByChapter);
            const difficultyMatch = 1 - Math.abs(question.difficultyWeight - userLevel);
            score += difficultyMatch * 25;
            if (difficultyMatch > 0.7) reasons.push('Optimal difficulty');

            // Factor 3: Question popularity/reliability (based on total attempts)
            if (question.totalAttempts > 10) {
                score += 10;
                reasons.push('Well-tested question');
            }

            // Factor 4: Avoid questions that are too easy/hard for everyone
            if (question.totalAttempts > 5) {
                const globalSuccessRate = question.correctCount / question.totalAttempts;
                if (globalSuccessRate > 0.2 && globalSuccessRate < 0.85) {
                    score += 15; // Good discrimination
                    reasons.push('Good difficulty balance');
                }
            }

            // Factor 5: Freshness (prefer questions not attempted at all)
            if (!attemptedQuestionIds.has(question.id)) {
                score += 10;
                reasons.push('Fresh question');
            }

            return { question, score, reasons };
        });

        // Sort by score and return top N
        scoredQuestions.sort((a, b) => b.score - a.score);
        return scoredQuestions.slice(0, count).map(sq => sq.question);
    }

    /**
     * Estimate user's current skill level (0.0 to 1.0)
     */
    private estimateUserLevel(performanceByChapter: Map<string, { correct: number; total: number }>): number {
        if (performanceByChapter.size === 0) return 0.3; // Beginner default

        let totalCorrect = 0;
        let totalAttempts = 0;

        performanceByChapter.forEach(perf => {
            totalCorrect += perf.correct;
            totalAttempts += perf.total;
        });

        if (totalAttempts === 0) return 0.3;

        const overallSuccessRate = totalCorrect / totalAttempts;

        // Map success rate to difficulty level
        // 0-40% success → 0.2 difficulty (easy)
        // 40-60% success → 0.5 difficulty (medium)
        // 60-80% success → 0.7 difficulty (hard)
        // 80%+ success → 0.9 difficulty (very hard)

        if (overallSuccessRate < 0.4) return 0.2;
        if (overallSuccessRate < 0.6) return 0.5;
        if (overallSuccessRate < 0.8) return 0.7;
        return 0.9;
    }

    /**
     * Adaptive Difficulty Engine - Recalibrate question difficulty based on actual performance
     */
    async calibrateDifficulty(): Promise<{ updated: number; report: any[] }> {
        const questions = await this.questionRepository.find({
            where: {},
            relations: ['subject', 'chapter']
        });

        const report: any[] = [];
        let updated = 0;

        for (const question of questions) {
            if (question.totalAttempts < 10) continue; // Need minimum data

            const successRate = question.correctCount / question.totalAttempts;
            let newDifficulty = question.difficultyWeight;

            // Recalibrate based on success rate
            if (successRate > 0.85) {
                newDifficulty = Math.max(0.1, question.difficultyWeight - 0.1); // Too easy
            } else if (successRate < 0.3) {
                newDifficulty = Math.min(1.0, question.difficultyWeight + 0.1); // Too hard
            } else {
                // Use IRT-inspired formula
                newDifficulty = 1 - successRate;
            }

            if (Math.abs(newDifficulty - question.difficultyWeight) > 0.05) {
                report.push({
                    questionId: question.id,
                    content: question.content.substring(0, 50) + '...',
                    oldDifficulty: question.difficultyWeight,
                    newDifficulty: newDifficulty,
                    successRate: successRate,
                    attempts: question.totalAttempts
                });

                question.difficultyWeight = newDifficulty;
                await this.questionRepository.save(question);
                updated++;
            }
        }

        return { updated, report };
    }

    /**
     * Topic Mastery Tracker - Calculate student proficiency at Subject/Chapter level
     */
    async getMasteryReport(userId: string): Promise<MasteryReport[]> {
        const userAttempts = await this.attemptRepository.find({
            where: { user: { id: userId } },
            relations: ['responses', 'responses.question', 'responses.question.subject', 'responses.question.chapter'],
        });

        // Aggregate performance by chapter
        const chapterStats = new Map<string, {
            subjectId: string;
            subjectTitle: string;
            chapterId: string;
            chapterTitle: string;
            correct: number;
            total: number;
            totalDifficulty: number;
        }>();

        for (const attempt of userAttempts) {
            if (!attempt.responses) continue;

            for (const response of attempt.responses) {
                if (!response.question?.chapter) continue;

                const key = response.question.chapter.id;
                const existing = chapterStats.get(key) || {
                    subjectId: response.question.subject?.id || '',
                    subjectTitle: response.question.subject?.title || 'Unknown',
                    chapterId: response.question.chapter.id,
                    chapterTitle: response.question.chapter.title,
                    correct: 0,
                    total: 0,
                    totalDifficulty: 0
                };

                existing.total++;
                if (response.isCorrect) {
                    existing.correct++;
                }
                existing.totalDifficulty += response.question.difficultyWeight;
                chapterStats.set(key, existing);
            }
        }

        // Calculate mastery scores
        const masteryReports: MasteryReport[] = [];

        chapterStats.forEach((stats) => {
            const successRate = stats.correct / stats.total;
            const avgDifficulty = stats.totalDifficulty / stats.total;

            // Mastery score: weighted by success rate and difficulty tackled
            const masteryScore = Math.min(100, (successRate * 70) + (avgDifficulty * 30));

            let recommendation = '';
            if (masteryScore < 40) {
                recommendation = 'Needs significant practice - start with easier questions';
            } else if (masteryScore < 60) {
                recommendation = 'Developing - continue regular practice';
            } else if (masteryScore < 80) {
                recommendation = 'Good progress - challenge with harder questions';
            } else {
                recommendation = 'Strong mastery - maintain with periodic review';
            }

            masteryReports.push({
                subjectId: stats.subjectId,
                subjectTitle: stats.subjectTitle,
                chapterId: stats.chapterId,
                chapterTitle: stats.chapterTitle,
                masteryScore: Math.round(masteryScore),
                totalAttempts: stats.total,
                correctAttempts: stats.correct,
                averageDifficulty: Math.round(avgDifficulty * 100) / 100,
                recommendation
            });
        });

        // Sort by mastery score (weakest first)
        masteryReports.sort((a, b) => a.masteryScore - b.masteryScore);

        return masteryReports;
    }

    async generateLearningPath(userId: string, targetQuestions: number = 50): Promise<{
        path: Question[];
        rationale: string;
    }> {
        const masteryReport = await this.getMasteryReport(userId);

        // Identify weakest chapters
        const weakChapters = masteryReport
            .filter(m => m.masteryScore < 70)
            .slice(0, 3); // Focus on top 3 weak areas

        const path: Question[] = [];
        let rationale = `Learning path designed to strengthen: ${weakChapters.map(c => c.chapterTitle).join(', ')}. `;

        for (const weakChapter of weakChapters) {
            const questionsNeeded = Math.ceil(targetQuestions / weakChapters.length);

            // Get questions for this chapter, starting with easier ones
            const chapterQuestions = await this.recommendQuestions(
                userId,
                questionsNeeded,
                weakChapter.subjectId,
                weakChapter.chapterId
            );

            path.push(...chapterQuestions);
        }

        rationale += `Total ${path.length} questions selected with progressive difficulty.`;

        return { path: path.slice(0, targetQuestions), rationale };
    }

    /**
     * AI Document Parser - Extracts questions from PDF/Image using Computer Vision
     */
    async parseDocument(file: any): Promise<any[]> {
        try {
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                You are an expert OCR and Question Extraction AI.
                I have uploaded a document (PDF or Image) containing multiple choice questions.
                
                Your task is to:
                1. Read the text from the image/pdf.
                2. Identify individual questions, their options, and the correct answer (if marked or obvious).
                3. If the correct answer is not provided, try to solve it or leave it as -1.
                4. Extract the explanation if provided, otherwise leave empty.
                5. Return the result strictly as a JSON Data Array. Do not include markdown formatting like \`\`\`json.

                Output Format:
                [
                    {
                        "content": "Question text here...",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctOptionIndex": 0, // 0 for A, 1 for B, etc.
                        "difficultyWeight": 0.5, // Estimate: 0.2 (easy) to 0.9 (hard)
                        "positiveMarks": 2, // Standard marking
                        "negativeMarks": 0.5, // Standard negative marking
                        "explanation": "Explanation text..."
                    }
                ]
            `;

            const imagePart = {
                inlineData: {
                    data: file.buffer.toString("base64"),
                    mimeType: file.mimetype,
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown if present
            const jsonStr = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("AI Parsing Failed:", error);
            throw new Error("Failed to parse document. Ensure it is a clear image or PDF of questions.");
        }
    }
}

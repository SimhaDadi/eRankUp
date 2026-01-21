import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt } from './entities/attempt.entity';
import { Question } from './entities/question.entity';
import { Model } from './entities/model.entity';
import { Response } from './entities/response.entity';
import { User } from '../users/user.entity';
import { DifficultyService } from './difficulty.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ScorerService {
    private redis: Redis;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(Model)
        private modelRepository: Repository<Model>,
        @InjectRepository(Response)
        private responseRepository: Repository<Response>,
        private difficultyService: DifficultyService,
    ) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
        });
    }

    async gradeAndSave(
        user: User,
        modelId: string,
        userAnswers: Record<string, string>,
        startTime: number,
        questionTimings: Record<string, number> = {},
        flags: string[] = [],
    ): Promise<Attempt> {
        console.log(`[Scorer] Grading attempt for User: ${user.id}, Model: ${modelId}`);

        // 1. Fetch questions/model
        let questions: Question[] = [];
        let examPos = 1.0;
        let examNeg = 0.25;
        let model: Model | null = null;

        if (modelId.startsWith('adaptive')) {
            // Fetch questions individually for adaptive sessions
            const questionIds = Object.keys(userAnswers);
            if (questionIds.length === 0) throw new Error('No questions attempted');

            questions = await this.questionRepository.find({
                where: questionIds.map(id => ({ id })),
                relations: ['subject', 'chapter']
            });
        } else {
            model = await this.modelRepository.findOne({
                where: { id: modelId },
                relations: ['questions', 'exams']
            });

            if (!model || !model.questions || model.questions.length === 0) {
                console.error(`[Scorer] No questions found for model ${modelId}`);
                throw new Error('No questions found for this model');
            }

            questions = model.questions;
            const targetExam = model.exams?.[0];
            examPos = targetExam?.defaultPositiveMarks || 1.0;
            examNeg = targetExam?.defaultNegativeMarks || 0.25;
        }

        const totalQuestions = questions.length;
        let correctAnswers = 0;
        let totalPossiblePoints = 0;
        let earnedPoints = 0;

        const questionResults: { questionId: string; isCorrect: boolean }[] = [];

        questions.forEach((q) => {
            const isCorrect = userAnswers[q.id] === q.correctOptionId;
            const hasAnswered = !!userAnswers[q.id];

            // Use Question specific marks if set, otherwise fallback to Exam defaults
            const posMark = q.positiveMarks != null ? q.positiveMarks : examPos;
            const negMark = q.negativeMarks != null ? q.negativeMarks : examNeg;

            totalPossiblePoints += posMark;

            if (isCorrect) {
                correctAnswers++;
                earnedPoints += posMark;
            } else if (hasAnswered) {
                earnedPoints -= negMark;
            }
            questionResults.push({ questionId: q.id, isCorrect });
        });

        // Async update of question stats
        this.difficultyService.bulkUpdateStats(questionResults).catch(err =>
            console.error('[Scorer] Failed to update question stats', err)
        );

        const score = totalPossiblePoints > 0 ? Math.max(0, (earnedPoints / totalPossiblePoints) * 100) : 0;
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);

        // 3. Save Attempt (model already fetched above)
        // The check `if (!model) throw new Error("Model not found when saving attempt");`
        // is removed to allow `model` to be null/undefined for adaptive sessions.
        // The `model: model || undefined` handles the relationship gracefully.

        const accuracy = (correctAnswers / totalQuestions) * 100;

        const attempt = this.attemptRepository.create({
            user,
            model: (model as any), // Handle null gracefully for TypeORM relationship
            score: Math.round(score * 100) / 100,
            totalQuestions,
            correctAnswers,
            accuracy: Math.round(accuracy * 100) / 100,
            timeTaken,
            userAnswers: userAnswers,
            questionTimings: questionTimings,
            responses: [] // Will be populated below
        });

        // 4. Create Response Entities (Granular)
        const responseEntities: Response[] = [];

        questions.forEach(q => {
            const selectedOptionId = userAnswers[q.id];
            const isCorrect = selectedOptionId === q.correctOptionId;
            const timeSpent = questionTimings[q.id] || 0;
            const wasReviewed = flags.includes(q.id);
            const wasSkipped = !selectedOptionId; // If visited but not answered? Simple check for now.

            // Only create response if we have data or if it was part of the test
            // We should probably create records for ALL questions to track skips vs not-visited
            // For now, let's create for all questions in the model

            const response = this.responseRepository.create({
                question: q,
                selectedOptionId: selectedOptionId || '', // Empty string if skipped
                isCorrect: !!selectedOptionId && isCorrect, // False if skipped
                timeSpent: timeSpent,
                wasSkipped: wasSkipped,
                wasReviewed: wasReviewed,
                answeredAt: new Date()
            });

            responseEntities.push(response);
        });

        attempt.responses = responseEntities;

        try {
            const savedAttempt = await this.attemptRepository.save(attempt);
            console.log(`[Scorer] Attempt saved successfully. ID: ${savedAttempt.id}`);

            // Invalidate leaderboard cache
            this.redis.del('leaderboard:global').catch(err =>
                console.error('[Scorer] Failed to invalidate leaderboard cache', err)
            );

            return savedAttempt;
        } catch (dbErr) {
            console.error(`[Scorer] DB Error saving attempt:`, dbErr);
            throw dbErr;
        }
    }

    async getAttempt(id: string) {
        return this.attemptRepository.findOne({
            where: { id },
            relations: ['model', 'model.chapter', 'model.exams', 'responses', 'responses.question'],
        });
    }

    async getLatestAttempts(userId: string) {
        return this.attemptRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            take: 10,
            relations: ['model'],
        });
    }

    async getGlobalLeaderboard() {
        const cacheKey = 'leaderboard:global';
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const leaderboard = await this.attemptRepository.createQueryBuilder('attempt')
            .leftJoinAndSelect('attempt.user', 'user')
            .select([
                'user.id',
                'user.name',
                'MAX(attempt.score) as max_score',
                'AVG(attempt.accuracy) as avg_accuracy'
            ])
            .groupBy('user.id')
            .orderBy('max_score', 'DESC')
            .limit(10)
            .getRawMany();

        // Cache for 5 minutes
        await this.redis.set(cacheKey, JSON.stringify(leaderboard), 'EX', 300);

        return leaderboard;
    }

    async getPerformanceTrend(userId: string) {
        return this.attemptRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'ASC' },
            relations: ['model']
        });
    }

    async getUserStats(userId: string) {
        const attempts = await this.attemptRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' }
        });

        if (attempts.length === 0) {
            return {
                totalAttempts: 0,
                averageScore: 0,
                totalTimeTaken: 0,
                accuracy: 0,
                streak: 0,
            };
        }

        const totalAttempts = attempts.length;
        const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
        const totalTimeTaken = attempts.reduce((acc, curr) => acc + curr.timeTaken, 0);
        const totalCorrect = attempts.reduce((acc, curr) => acc + curr.correctAnswers, 0);
        const totalQuestions = attempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);

        // Calculate Streak
        // 1. Get unique dates of attempts (YYYY-MM-DD)
        const uniqueDates = Array.from(new Set(attempts.map(a => new Date(a.createdAt).toISOString().split('T')[0]))).sort((a, b) => b.localeCompare(a)); // Descending order

        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];

        // Check if the most recent attempt is today or yesterday to start the streak
        if (uniqueDates.length > 0 && (uniqueDates[0] === today || uniqueDates[0] === yesterday)) {
            streak = 1;
            let currentDate = new Date(uniqueDates[0]);

            // Iterate backwards
            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = new Date(currentDate);
                prevDate.setDate(prevDate.getDate() - 1);
                const expectedPrevStr = prevDate.toISOString().split('T')[0];

                if (uniqueDates[i] === expectedPrevStr) {
                    streak++;
                    currentDate = prevDate;
                } else {
                    break;
                }
            }
        }

        return {
            totalAttempts,
            averageScore: Math.round(totalScore / totalAttempts),
            totalTimeTaken,
            accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            streak,
        };
    }
}

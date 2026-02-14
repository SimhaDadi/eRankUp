import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, IsNull, In } from 'typeorm';
import { Attempt } from './entities/attempt.entity';
import { Question } from './entities/question.entity';
import { Model } from './entities/model.entity';
import { Exam } from './entities/exam.entity';
import { Response } from './entities/response.entity';
import { User } from '../users/user.entity';
import { UserStats } from '../users/entities/user-stats.entity';
import { DifficultyService } from './difficulty.service';
import { CacheService } from '../common/cache.service';
import { GamificationService } from '../gamification/gamification.service';
import { AdaptiveLearningService } from '../adaptive-learning/adaptive-learning.service';
import { isUUID } from '../common/utils';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ScorerService implements OnModuleInit {
    private readonly logger = new Logger(ScorerService.name);

    constructor(
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(Model)
        private modelRepository: Repository<Model>,
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        @InjectRepository(Response)
        private responseRepository: Repository<Response>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(UserStats)
        private userStatsRepository: Repository<UserStats>,
        private difficultyService: DifficultyService,
        private cacheService: CacheService,
        private gamificationService: GamificationService,
        private adaptiveLearningService: AdaptiveLearningService,
        private aiService: AIService, // Injected
    ) { }

    // ... (existing code)

    async getAttempt(id: string, userId: string) {
        const attempt = await this.attemptRepository.findOne({
            where: { id, user: { id: userId } },
            relations: ['model', 'model.chapter', 'model.exams', 'exam', 'responses', 'responses.question'],
        });

        if (attempt?.responses) {
            // Lazy Load Explanations: Check if any question lacks an explanation
            const questionsWithoutExplanation = attempt.responses
                .map(r => r.question)
                .filter(q => q && (!q.explanation || q.explanation.trim() === ''));

            if (questionsWithoutExplanation.length > 0) {
                this.logger.log(`[ScorerService] Found ${questionsWithoutExplanation.length} questions without explanation. Generating on-demand...`);

                // Process in parallel (but limited by QueueService underneath)
                await Promise.all(questionsWithoutExplanation.map(async (q) => {
                    try {
                        const explanation = await this.aiService.generateQuestionExplanation(q);
                        if (explanation) {
                            q.explanation = explanation;
                            await this.questionRepository.save(q);
                            this.logger.log(`[ScorerService] Generated and saved explanation for Question ${q.id}`);
                        }
                    } catch (err) {
                        this.logger.error(`[ScorerService] Failed to generate on-demand explanation for Q ${q.id}`, err.stack);
                    }
                }));
            }
        }

        return attempt;
    }

    async getLatestAttempts(userId: string, limit: number = 10) {
        return this.attemptRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['model', 'exam', 'model.chapter'],
        });
    }

    async getAttemptsForExam(examId: string, userId: string) {
        return this.attemptRepository.find({
            where: [
                { user: { id: userId }, exam: { id: examId } },
                { user: { id: userId }, model: { exams: { id: examId } } }
            ],
            order: { createdAt: 'DESC' },
            relations: ['model', 'exam']
        });
    }

    async getGlobalLeaderboard() {
        const cacheKey = 'leaderboard:global';
        const cached = await this.cacheService.get<any>(cacheKey);

        if (cached) {
            return cached;
        }

        const leaderboard = await this.attemptRepository.createQueryBuilder('attempt')
            .innerJoin('attempt.user', 'user')
            .select([
                'user.id AS userId',
                'user.fullName AS fullName',
                'MAX(attempt.score) AS maxScore',
                'AVG(attempt.accuracy) AS avgAccuracy'
            ])
            .groupBy('user.id')
            .addGroupBy('user.fullName')
            .orderBy('maxScore', 'DESC')
            .limit(10)
            .getRawMany();

        // Cache for 5 minutes
        await this.cacheService.set(cacheKey, leaderboard, 300);

        return leaderboard;
    }

    async getPerformanceTrend(userId: string, limit: number = 20) {
        return this.attemptRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'ASC' },
            take: limit,
            relations: ['model', 'exam']
        });
    }

    async getUserStats(userId: string) {
        const cacheKey = `stats:user:${userId}`;
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        const stats = await this.userStatsRepository.findOne({ where: { userId } });

        if (!stats) {
            return {
                totalAttempts: 0,
                averageScore: 0,
                bestScore: 0,
                totalTimeTaken: 0,
                accuracy: 0,
                streak: 0,
                dailyQuestions: 0,
                topicPerformance: [],
                topTopicRecommendation: 'Start your first test!'
            };
        }

        const accuracy = stats.totalQuestionsAttempted > 0
            ? Math.round((stats.totalCorrect / stats.totalQuestionsAttempted) * 100)
            : 0;

        const averageScore = stats.totalAttempts > 0
            ? Math.round(stats.totalScore / stats.totalAttempts)
            : 0;

        // Transform topic perf
        const topicPerformance = Object.keys(stats.topicPerformance || {}).map(topic => ({
            subject: topic,
            A: Math.round((stats.topicPerformance[topic].correct / stats.topicPerformance[topic].total) * 100),
            fullMark: 100
        }));

        // Fill defaults
        if (topicPerformance.length < 3) {
            const defaults = ['Algebra', 'Geometry', 'Arithmetic', 'Reasoning', 'Verbal'];
            defaults.forEach(d => {
                if (!topicPerformance.find(t => t.subject === d)) {
                    topicPerformance.push({ subject: d, A: 0, fullMark: 100 });
                }
            });
        }

        // TODO: "Best Score" is not stored in stats. We might want to add it.
        // For now, perform quick query for MAX score (indexed) - fast enough.
        const maxResult = await this.attemptRepository.createQueryBuilder('attempt')
            .select('MAX(attempt.score)', 'max')
            .where('attempt.userId = :userId', { userId })
            .getRawOne();
        const bestScore = maxResult ? parseFloat(maxResult.max) || 0 : 0;

        // Daily questions needs "today's" count. 
        // We can't easily get this from summary table without a "daily_stats" table.
        // We will skip daily questions count or use a quick count query for today only.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyCount = await this.attemptRepository.count({
            where: {
                user: { id: userId },
                createdAt: MoreThanOrEqual(today)
            }
        });
        // Count represents exams, not questions... 
        // Use SUM(totalQuestions)
        const dailyQs = await this.attemptRepository.createQueryBuilder('attempt')
            .select('SUM(attempt.totalQuestions)', 'total')
            .where('attempt.userId = :userId', { userId })
            .andWhere('attempt.createdAt >= :today', { today })
            .getRawOne();
        const dailyQuestions = dailyQs ? parseInt(dailyQs.total) || 0 : 0;

        // AI Rec
        const weakAreas = await this.adaptiveLearningService.getWeakAreas(userId, 1);
        const topTopicRecommendation = weakAreas.length > 0
            ? `${weakAreas[0].topic}: Focus on this to boost your score`
            : 'Take a diagnostic test now';

        const result = {
            totalAttempts: stats.totalAttempts,
            averageScore,
            bestScore,
            totalTimeTaken: stats.totalTimeTaken,
            accuracy,
            streak: stats.currentStreak,
            dailyQuestions,
            topicPerformance,
            topTopicRecommendation
        };

        await this.cacheService.set(cacheKey, result, 300);
        return result;
    }

    async getUserExamStats(userId: string) {
        const attempts = await this.attemptRepository.find({
            where: { user: { id: userId } },
            relations: ['model', 'model.exams', 'exam'],
            order: { createdAt: 'DESC' }
        });

        this.logger.log(`Found ${attempts.length} attempts for user ${userId}`);

        const stats: Record<string, { count: number; latestScore: number; bestScore: number; attemptedModelIds: string[]; latestAttemptId?: string }> = {};

        for (const attempt of attempts) {
            const examId = attempt.exam?.id || attempt.model?.exams?.[0]?.id;

            if (!examId) continue;

            if (!stats[examId]) {
                stats[examId] = {
                    count: 0,
                    latestScore: attempt.score,
                    bestScore: attempt.score,
                    attemptedModelIds: [],
                    latestAttemptId: attempt.id
                };
            }
            stats[examId].count++;
            stats[examId].bestScore = Math.max(stats[examId].bestScore, attempt.score);

            // Since attempts are DESC, the latestAttemptId is already the first one found
            // No need to update it for subsequent older attempts in the loop

            const refId = attempt.model?.id || attempt.exam?.id;
            if (refId && !stats[examId].attemptedModelIds.includes(refId)) {
                stats[examId].attemptedModelIds.push(refId);
            }
        }

        this.logger.log(`Generated stats for exams: ${Object.keys(stats).join(', ')}`);
        return stats;
    }

    async repairAttemptConnections() {
        this.logger.log('Starting attempt connection repair...');
        const attempts = await this.attemptRepository.find({
            relations: ['model', 'model.exams', 'exam'],
            where: {
                exam: IsNull(),
            },
        });

        let fixed = 0;
        for (const attempt of attempts) {
            // Case 1: Has Model, but no Exam relation. Link to Model's first exam.
            if (!attempt.exam && attempt.model && attempt.model.exams && attempt.model.exams.length > 0) {
                attempt.exam = attempt.model.exams[0];
                await this.attemptRepository.save(attempt);
                fixed++;
                this.logger.log(`Linked Attempt ${attempt.id} to Exam ${attempt.exam.id} via Model ${attempt.model.id}`);
            }
        }
        this.logger.log(`Finished. Fixed ${fixed} attempts.`);
        return { fixed, totalScanned: attempts.length };
    }

    async onModuleInit() {
        this.logger.log('Module Init - Running diagnostics...');

        // Wait 5 seconds to ensure Redis and DB are warm/initialized
        setTimeout(async () => {
            try {
                // Clear exams cache to ensure fresh data after code updates
                await this.cacheService.del('exams:all');
                this.logger.log('Cleared exams:all cache');

                await this.repairAttemptConnections();
            } catch (e) {
                this.logger.error('Initialization/Repair failed', e.stack);
            }
        }, 5000);
    }
}

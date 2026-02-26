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
import { ExplanationService } from '../ai/explanation.service';
import { UserRole } from '../users/user.entity';

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
        private explanationService: ExplanationService,
    ) { }

    async gradeAndSave(
        user: User,
        modelId: string, // Can be Model ID or Exam ID
        userAnswers: Record<string, string>,
        startTime: number,
        questionTimings: Record<string, number> = {},
        flags: string[] = [],
        allQuestionIds: string[] = [],
    ): Promise<Attempt> {
        this.logger.log(`Grading attempt for User: ${user.id}, ID: ${modelId}`);

        // 1. Fetch questions/model/exam
        let questions: Question[] = [];
        let examPos = 1.0;
        let examNeg = 0.25;
        let model: Model | null = null;
        let exam: Exam | null = null;

        // 0. Handle prefixes for Model/Exam retrieval
        const cleanId = modelId.startsWith('chapter-') ? modelId.replace('chapter-', '') : modelId;
        this.logger.log(`[ScorerService] Using Clean ID: ${cleanId} (original: ${modelId})`);

        if (modelId.startsWith('adaptive')) {
            // Fetch questions individually for adaptive sessions
            // Use all assigned questions if available, otherwise fallback to attempted ones (which might skew score if skipped)
            const targetIds = (allQuestionIds && allQuestionIds.length > 0)
                ? allQuestionIds
                : Object.keys(userAnswers);

            if (targetIds.length === 0) throw new Error('No questions found for grading');

            questions = await this.questionRepository.find({
                where: targetIds.map(id => ({ id })),
                relations: ['subject', 'chapter']
            });
        } else {
            // Try fetching as Model first
            model = isUUID(cleanId) ? await this.modelRepository.findOne({
                where: { id: cleanId },
                relations: ['questions', 'exams']
            }) : null;

            if (model) {
                if (!model.questions || model.questions.length === 0) {
                    this.logger.error(`No questions found for model ${modelId}`);
                    throw new Error('No questions found for this model');
                }
                questions = model.questions;
                const targetExam = model.exams?.[0];
                examPos = targetExam?.defaultPositiveMarks || 1.0;
                examNeg = targetExam?.defaultNegativeMarks || 0.25;
            } else {
                // Try fetching as Exam
                exam = isUUID(cleanId) ? await this.examRepository.findOne({
                    where: { id: cleanId },
                    relations: ['questions']
                }) : null;

                if (exam) {
                    if (!exam.questions || exam.questions.length === 0) {
                        this.logger.error(`No questions found for exam ${modelId}`);
                        throw new Error('No questions found for this exam');
                    }
                    questions = exam.questions;
                    examPos = exam.defaultPositiveMarks || 1.0;
                    examNeg = exam.defaultNegativeMarks || 0.25;
                } else if (allQuestionIds && allQuestionIds.length > 0) {
                    // [FIX] Fallback for Chapter Practice or other dynamic sessions
                    this.logger.log(`[ScorerService] No Model/Exam found, but ${allQuestionIds.length} questions provided. Proceeding with default marks.`);
                    questions = await this.questionRepository.find({
                        where: { id: In(allQuestionIds) },
                        relations: ['subject', 'chapter']
                    });
                    examPos = 1.0;
                    examNeg = 0.25;
                } else {
                    this.logger.error(`No Model or Exam found with ID ${modelId}`);
                    throw new Error('Test not found');
                }
            }
        }

        const totalQuestions = questions.length;
        let correctAnswers = 0;
        let totalPossiblePoints = 0;
        let earnedPoints = 0;

        const questionResults: { questionId: string; isCorrect: boolean }[] = [];
        let positiveMarksEarned = 0;
        let negativeMarksIncurred = 0;
        let skippedAnswers = 0;
        let markedForReview = 0;

        questions.forEach((q) => {
            const selectedOptionId = userAnswers[q.id];
            const isCorrect = selectedOptionId === q.correctOptionId;
            const hasAnswered = !!selectedOptionId;
            const isReviewed = flags.includes(q.id);

            // Use Question specific marks if set, otherwise fallback to Exam defaults
            const posMark = q.positiveMarks != null ? q.positiveMarks : examPos;
            const negMark = q.negativeMarks != null ? q.negativeMarks : examNeg;

            totalPossiblePoints += posMark;

            if (isCorrect) {
                correctAnswers++;
                earnedPoints += posMark;
                positiveMarksEarned += posMark;
            } else if (hasAnswered) {
                earnedPoints -= negMark;
                negativeMarksIncurred += negMark;
            } else {
                skippedAnswers++;
            }

            if (isReviewed) markedForReview++;

            questionResults.push({ questionId: q.id, isCorrect });
        });

        // 2. Update question stats (Async - don't block user response)
        const statsPayload = questionResults.map(res => ({
            ...res,
            timeSpent: questionTimings[res.questionId] || 0
        }));
        this.difficultyService.bulkUpdateStats(statsPayload)
            .catch(err => this.logger.error('Failed to update question stats (Async)', err.stack));

        const score = totalPossiblePoints > 0 ? Math.max(0, (earnedPoints / totalPossiblePoints) * 100) : 0;
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        const topicAnalysis: Record<string, { correct: number, total: number }> = {};
        questions.forEach(q => {
            const topic = q.topic || 'General';
            if (!topicAnalysis[topic]) topicAnalysis[topic] = { correct: 0, total: 0 };
            topicAnalysis[topic].total++;
            if (userAnswers[q.id] === q.correctOptionId) {
                topicAnalysis[topic].correct++;
            }
        });

        // 3. Save Attempt
        const attempt = this.attemptRepository.create({
            user: { id: user.id } as User,
            model: model ? ({ id: model.id } as Model) : undefined,
            exam: exam ? ({ id: exam.id } as Exam) : undefined,
            score: Math.round(score * 100) / 100,
            totalQuestions,
            correctAnswers,
            accuracy: Math.round(accuracy * 100) / 100,
            timeTaken,
            userAnswers: userAnswers,
            questionTimings: questionTimings,
            responses: [],
            insights: {
                strengths: score > 70 ? ['Strong overall performance'] : ['Keep practicing!'],
                weaknesses: score < 50 ? ['Improve speed and accuracy'] : [],
                recommendation: score > 80 ? 'Great job! Try a harder test.' : 'Review the topics you missed.',
                topicAnalysis: topicAnalysis,
                metrics: {
                    positiveMarksEarned: Math.round(positiveMarksEarned * 100) / 100,
                    negativeMarksIncurred: Math.round(negativeMarksIncurred * 100) / 100,
                    netMarks: Math.round(earnedPoints * 100) / 100,
                    totalPossibleMarks: Math.round(totalPossiblePoints * 100) / 100,
                    skippedAnswers,
                    markedForReview
                }
            }
        });

        // 4. Create Response Entities (Granular)
        const responseEntities: Response[] = questions.map(q => {
            const selectedOptionId = userAnswers[q.id];
            const isCorrect = selectedOptionId === q.correctOptionId;
            const timeSpent = questionTimings[q.id] || 0;
            const wasReviewed = flags.includes(q.id);
            const wasSkipped = !selectedOptionId;

            return this.responseRepository.create({
                // attempt: attempt, // Let cascade-save handle the relationship
                question: { id: q.id } as Question,
                selectedOptionId: selectedOptionId || '',
                isCorrect: !!selectedOptionId && isCorrect,
                timeSpent: timeSpent,
                wasSkipped: wasSkipped,
                wasReviewed: wasReviewed,
                answeredAt: new Date()
            });
        });

        attempt.responses = responseEntities;

        try {
            const savedAttempt = await this.attemptRepository.save(attempt);
            this.logger.log(`Attempt saved successfully. ID: ${savedAttempt.id}`);

            // Invalidate leaderboard cache
            this.cacheService.del('leaderboard:global').catch(err =>
                this.logger.error('Failed to invalidate leaderboard cache', err.stack)
            );
            // Invalidate user stats cache
            this.cacheService.del(`stats:user:${user.id}`).catch(err =>
                this.logger.error('Failed to invalidate user stats cache', err.stack)
            );

            // Invalidate advanced analytics caches
            Promise.all([
                this.cacheService.del(`analytics:matrix:${user.id}`),
                this.cacheService.del(`analytics:peer:${user.id}`),
                this.cacheService.del(`analytics:mastery:${user.id}`)
                // 'analytics:patterns' might also need invalidation if implemented via cache
            ]).catch(err => this.logger.error('Failed to invalidate analytics cache', err.stack));

            // === GAMIFICATION INTEGRATION ===
            try {
                // Award XP for completing test
                const baseXP = 50; // Base XP for completing a test
                const correctXP = correctAnswers * 10; // 10 XP per correct answer
                const perfectBonus = (correctAnswers === totalQuestions) ? 100 : 0; // Bonus for perfect score
                const totalXP = baseXP + correctXP + perfectBonus;

                const levelUpResult = await this.gamificationService.awardXP(
                    user.id,
                    totalXP,
                    `Completed test: ${correctAnswers}/${totalQuestions} correct`
                );

                // Update streak
                await this.gamificationService.updateStreak(user.id);

                // Update badge criteria tracking
                const profile = await this.gamificationService.getOrCreateProfile(user.id);
                profile.testsCompleted += 1;
                profile.correctAnswers += correctAnswers;
                await this.gamificationService['gamificationRepo'].save(profile);

                // Add level-up info to attempt for frontend
                (savedAttempt as any).levelUp = levelUpResult;

                this.logger.log(`Awarded ${totalXP} XP to user ${user.id}`);
            } catch (gamificationErr) {
                this.logger.error('Failed to award gamification rewards', gamificationErr.stack);
                // Don't fail the attempt if gamification fails
            }

            // === ADAPTIVE LEARNING INTEGRATION (Async) ===
            this.adaptiveLearningService.updateTopicMastery(user.id, responseEntities)
                .then(() => this.logger.log(`Updated topic mastery (Async) for user ${user.id}`))
                .catch(err => this.logger.error('Failed to update topic mastery', err.stack));

            // === USER STATS INCREMENTAL UPDATE ===
            try {
                let stats = await this.userStatsRepository.findOne({ where: { userId: user.id } });
                if (!stats) {
                    stats = this.userStatsRepository.create({
                        userId: user.id,
                        totalAttempts: 0,
                        totalScore: 0,
                        totalQuestionsAttempted: 0,
                        totalCorrect: 0,
                        totalTimeTaken: 0,
                        currentStreak: 0,
                        lastAttemptDate: new Date(0), // Epoch
                        topicPerformance: {}
                    });
                }

                // Streak Calculation
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const lastDate = stats.lastAttemptDate ? new Date(stats.lastAttemptDate).toISOString().split('T')[0] : '';

                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterday = yesterdayDate.toISOString().split('T')[0];

                if (lastDate === yesterday) {
                    stats.currentStreak += 1;
                } else if (lastDate !== today) {
                    // If not today and not yesterday, reset (unless it's the very first one, where currStreak is 0 -> 1)
                    stats.currentStreak = 1;
                }
                // If lastDate === today, do nothing to streak

                stats.lastAttemptDate = now;
                stats.totalAttempts += 1;
                stats.totalScore += attempt.score;
                stats.totalQuestionsAttempted += totalQuestions;
                stats.totalCorrect += correctAnswers;
                stats.totalTimeTaken += timeTaken;

                // Topic Performance
                const currentTopics = stats.topicPerformance || {};
                Object.keys(topicAnalysis).forEach(topic => {
                    if (!currentTopics[topic]) currentTopics[topic] = { correct: 0, total: 0 };
                    currentTopics[topic].total += topicAnalysis[topic].total;
                    currentTopics[topic].correct += topicAnalysis[topic].correct;
                });
                stats.topicPerformance = currentTopics;

                await this.userStatsRepository.save(stats);
                this.logger.log(`Updated stats for user ${user.id}`);
            } catch (statsErr) {
                this.logger.error('Failed to update user stats', statsErr.stack);
            }

            return savedAttempt;
        } catch (dbErr) {
            this.logger.error(`DB Error saving attempt: ${dbErr.message}`, dbErr.stack);
            throw dbErr;
        }
    }

    async getAttempt(id: string, userId: string) {
        // [OPTIMIZATION] Spliting retrieval into two steps to avoid massive join overhead
        // 1. Fetch Attempt and high-level metadata
        const attempt = await this.attemptRepository.findOne({
            where: { id, user: { id: userId } },
            relations: ['model', 'model.chapter', 'model.exams', 'exam'],
        });

        if (!attempt) return null;

        // 2. Fetch Responses with their nested details in a separate batch
        attempt.responses = await this.responseRepository.find({
            where: { attempt: { id: attempt.id } },
            relations: ['question', 'question.chapter'],
            // Ensure consistent order matches attempt sequence
            order: { answeredAt: 'ASC' }
        });

        // 3. Hydrate questions with unified explanations
        if (attempt.responses && attempt.responses.length > 0) {
            const questions = attempt.responses.map(r => r.question).filter(Boolean);
            const questionIds = questions.map(q => q.id);

            // Check if user is admin
            const user = await this.userRepository.findOne({ where: { id: userId } });
            const isAdmin = user?.role === UserRole.ADMIN;

            const explanations = await this.explanationService.getUnifiedExplanationsBulk(
                questionIds,
                attempt.exam?.id || attempt.model?.exams?.[0]?.id,
                isAdmin
            );

            for (const q of questions) {
                if (explanations[q.id]) {
                    q.explanation = explanations[q.id];
                }
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
        // [OPTIMIZATION] Using QueryBuilder with projection to avoid fetching full entities
        // and large relation graphs. This is significantly faster for users with many attempts.
        const rawAttempts = await this.attemptRepository.createQueryBuilder('attempt')
            .leftJoin('attempt.model', 'model')
            .leftJoin('model.exams', 'modelExams')
            .leftJoin('attempt.exam', 'directExam')
            .select([
                'attempt.id',
                'attempt.score',
                'attempt.createdAt',
                'directExam.id',
                'model.id',
                'modelExams.id'
            ])
            .where('attempt.userId = :userId', { userId })
            .orderBy('attempt.createdAt', 'DESC')
            .getRawMany();

        this.logger.log(`Found ${rawAttempts.length} raw attempt records for user ${userId}`);

        const stats: Record<string, { count: number; latestScore: number; bestScore: number; attemptedModelIds: string[]; latestAttemptId?: string }> = {};

        for (const row of rawAttempts) {
            // Map raw column names (TypeORM aliases them with entity_property)
            const examId = row.directExam_id || row.modelExams_id;

            if (!examId) continue;

            if (!stats[examId]) {
                stats[examId] = {
                    count: 0,
                    latestScore: row.attempt_score,
                    bestScore: row.attempt_score,
                    attemptedModelIds: [],
                    latestAttemptId: row.attempt_id
                };
            }
            stats[examId].count++;
            stats[examId].bestScore = Math.max(stats[examId].bestScore, row.attempt_score);

            // latestAttemptId and latestScore are already correct because of DESC order

            const refId = row.model_id || row.directExam_id;
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

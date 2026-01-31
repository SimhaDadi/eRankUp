import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt } from './entities/attempt.entity';
import { Question } from './entities/question.entity';
import { Model } from './entities/model.entity';
import { Exam } from './entities/exam.entity';
import { Response } from './entities/response.entity';
import { User } from '../users/user.entity';
import { DifficultyService } from './difficulty.service';
import { CacheService } from '../common/cache.service';
import { GamificationService } from '../gamification/gamification.service';
import { AdaptiveLearningService } from '../adaptive-learning/adaptive-learning.service';

@Injectable()
export class ScorerService implements OnModuleInit {
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
        private difficultyService: DifficultyService,
        private cacheService: CacheService,
        private gamificationService: GamificationService,
        private adaptiveLearningService: AdaptiveLearningService,
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
        console.log(`[Scorer] Grading attempt for User: ${user.id}, ID: ${modelId}`);

        // 1. Fetch questions/model/exam
        let questions: Question[] = [];
        let examPos = 1.0;
        let examNeg = 0.25;
        let model: Model | null = null;
        let exam: Exam | null = null;

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
            model = await this.modelRepository.findOne({
                where: { id: modelId },
                relations: ['questions', 'exams']
            });

            if (model) {
                if (!model.questions || model.questions.length === 0) {
                    console.error(`[Scorer] No questions found for model ${modelId}`);
                    throw new Error('No questions found for this model');
                }
                questions = model.questions;
                const targetExam = model.exams?.[0];
                examPos = targetExam?.defaultPositiveMarks || 1.0;
                examNeg = targetExam?.defaultNegativeMarks || 0.25;
            } else {
                // Try fetching as Exam
                exam = await this.examRepository.findOne({
                    where: { id: modelId },
                    relations: ['questions']
                });

                if (exam) {
                    if (!exam.questions || exam.questions.length === 0) {
                        console.error(`[Scorer] No questions found for exam ${modelId}`);
                        throw new Error('No questions found for this exam');
                    }
                    questions = exam.questions;
                    examPos = exam.defaultPositiveMarks || 1.0;
                    examNeg = exam.defaultNegativeMarks || 0.25;
                } else {
                    console.error(`[Scorer] No Model or Exam found with ID ${modelId}`);
                    throw new Error('Test not found');
                }
            }
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

        // 2. Update question stats (Async - don't block user response)
        const statsPayload = questionResults.map(res => ({
            ...res,
            timeSpent: questionTimings[res.questionId] || 0
        }));
        this.difficultyService.bulkUpdateStats(statsPayload)
            .catch(err => console.error('[Scorer] Failed to update question stats (Async)', err));

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
                topicAnalysis: topicAnalysis
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
            console.log(`[Scorer] Attempt saved successfully. ID: ${savedAttempt.id}`);

            // Invalidate leaderboard cache
            this.cacheService.del('leaderboard:global').catch(err =>
                console.error('[Scorer] Failed to invalidate leaderboard cache', err)
            );
            // Invalidate user stats cache
            // Invalidate user stats cache
            this.cacheService.del(`stats:user:${user.id}`).catch(err =>
                console.error('[Scorer] Failed to invalidate user stats cache', err)
            );

            // Invalidate advanced analytics caches
            Promise.all([
                this.cacheService.del(`analytics:matrix:${user.id}`),
                this.cacheService.del(`analytics:peer:${user.id}`),
                this.cacheService.del(`analytics:mastery:${user.id}`)
                // 'analytics:patterns' might also need invalidation if implemented via cache
            ]).catch(err => console.error('[Scorer] Failed to invalidate analytics cache', err));

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

                console.log(`[Scorer] Awarded ${totalXP} XP to user ${user.id}`);
            } catch (gamificationErr) {
                console.error('[Scorer] Failed to award gamification rewards', gamificationErr);
                // Don't fail the attempt if gamification fails
            }

            // === ADAPTIVE LEARNING INTEGRATION (Async) ===
            this.adaptiveLearningService.updateTopicMastery(user.id, responseEntities)
                .then(() => console.log(`[Scorer] Updated topic mastery (Async) for user ${user.id}`))
                .catch(err => console.error('[Scorer] Failed to update topic mastery', err));

            return savedAttempt;
        } catch (dbErr) {
            console.error(`[Scorer] DB Error saving attempt:`, dbErr);
            throw dbErr;
        }
    }

    async getAttempt(id: string, userId: string) {
        return this.attemptRepository.findOne({
            where: { id, user: { id: userId } },
            relations: ['model', 'model.chapter', 'model.exams', 'exam', 'responses', 'responses.question'],
        });
    }

    async getLatestAttempts(userId: string) {
        return this.attemptRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            take: 10,
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

    async getPerformanceTrend(userId: string) {
        return this.attemptRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'ASC' },
            relations: ['model', 'exam']
        });
    }

    async getUserStats(userId: string) {
        const cacheKey = `stats:user:${userId}`;
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        // Fetch user to get signup date
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

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

        // Calculate Streak - ONLY count attempts after user signup
        const userSignupDate = new Date(user.createdAt);
        const attemptsAfterSignup = attempts.filter(a => new Date(a.createdAt) >= userSignupDate);

        // Get unique dates of attempts AFTER signup (YYYY-MM-DD)
        const uniqueDates = Array.from(
            new Set(attemptsAfterSignup.map(a => new Date(a.createdAt).toISOString().split('T')[0]))
        ).sort((a, b) => b.localeCompare(a)); // Descending order

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

        // Calculate Topic Performance
        const topicStats = await this.responseRepository.createQueryBuilder('response')
            .leftJoin('response.question', 'question')
            .innerJoin('response.attempt', 'attempt') // Ensure we only count user's attempts
            .where('attempt.userId = :userId', { userId })
            .select([
                'question.topic AS topic',
                'COUNT(response.id) AS total',
                'SUM(CASE WHEN response.isCorrect THEN 1 ELSE 0 END) AS correct'
            ])
            .groupBy('question.topic')
            .getRawMany();

        const topicPerformance = topicStats
            .filter(stat => parseInt(stat.total) > 0)
            .map(stat => ({
                subject: stat.topic || 'General',
                A: Math.round((parseInt(stat.correct) / parseInt(stat.total)) * 100) || 0,
                fullMark: 100
            }));

        // Fill with comprehensive defaults if empty (aesthetic fallback)
        if (topicPerformance.length < 3) {
            const defaults = ['Algebra', 'Geometry', 'Arithmetic', 'Reasoning', 'Verbal'];
            defaults.forEach(d => {
                if (!topicPerformance.find(t => t.subject === d)) {
                    topicPerformance.push({ subject: d, A: 0, fullMark: 100 });
                }
            });
        }

        // Calculate Daily Progress (Questions Attempted Today)
        let dailyQuestions = 0;
        attempts.forEach(a => {
            const attemptDate = new Date(a.createdAt).toISOString().split('T')[0];
            if (attemptDate === today) {
                dailyQuestions += a.totalQuestions;
            }
        });

        // Get AI recommendation for Home Screen
        const weakAreas = await this.adaptiveLearningService.getWeakAreas(userId, 1);
        const topTopicRecommendation = weakAreas.length > 0
            ? `${weakAreas[0].topic}: Focus on this to boost your score`
            : 'Take a diagnostic test now';

        // Calculate Best Score
        const bestScore = attempts.length > 0
            ? Math.max(...attempts.map(a => a.score))
            : 0;

        const stats = {
            totalAttempts,
            averageScore: Math.round(totalScore / totalAttempts),
            bestScore,
            totalTimeTaken,
            accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            streak,
            dailyQuestions,
            topicPerformance,
            topTopicRecommendation
        };

        await this.cacheService.set(cacheKey, stats, 300); // Cache for 5 mins
        return stats;
    }
    async getUserExamStats(userId: string) {
        const attempts = await this.attemptRepository.find({
            where: { user: { id: userId } },
            relations: ['model', 'model.exams', 'exam'],
            order: { createdAt: 'DESC' }
        });

        console.log(`[Stats] Found ${attempts.length} attempts for user ${userId}`);

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

        console.log(`[Stats] Generated stats for exams:`, Object.keys(stats));
        return stats;
    }

    async repairAttemptConnections() {
        console.log('[Repair] Starting attempt connection repair...');
        const attempts = await this.attemptRepository.find({
            relations: ['model', 'model.exams', 'exam'],
            where: [
                { exam: { id: null } as any }, // Attempts with no exam
            ]
        });

        let fixed = 0;
        for (const attempt of attempts) {
            // Case 1: Has Model, but no Exam relation. Link to Model's first exam.
            if (!attempt.exam && attempt.model && attempt.model.exams && attempt.model.exams.length > 0) {
                attempt.exam = attempt.model.exams[0];
                await this.attemptRepository.save(attempt);
                fixed++;
                console.log(`[Repair] Linked Attempt ${attempt.id} to Exam ${attempt.exam.id} via Model ${attempt.model.id}`);
            }
        }
        console.log(`[Repair] Finished. Fixed ${fixed} attempts.`);
        return { fixed, totalScanned: attempts.length };
    }

    async onModuleInit() {
        console.log('[Scorer] Module Init - Running diagnostics...');

        // Wait 5 seconds to ensure Redis and DB are warm/initialized
        setTimeout(async () => {
            try {
                // Clear exams cache to ensure fresh data after code updates
                await this.cacheService.del('exams:all');
                console.log('[Scorer] Cleared exams:all cache');

                await this.repairAttemptConnections();
            } catch (e) {
                console.error('[Scorer] Initialization/Repair failed', e);
            }
        }, 5000);
    }
}

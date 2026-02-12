import { Injectable, OnModuleInit, OnModuleDestroy, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ScorerService } from '../exams/scorer.service';
import { UsersService } from '../users/users.service';
import { ExamsService } from '../exams/exams.service';
import { Model } from '../exams/entities/model.entity';

export interface TestSession {
    userId: string;
    testId: string; // Model ID
    startTime: number;
    pausedAt?: number;
    accumulatedTime?: number; // Total seconds spent BEFORE current resume
    answers: Record<string, string>; // questionId -> optionId
    timings: Record<string, number>; // questionId -> seconds spent
    flags: string[]; // array of questionId
    status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
    durationSeconds?: number; // Total allowed time in seconds
    questions?: any[]; // Local questions for adaptive sessions
}

@Injectable()
export class TestSessionService implements OnModuleInit, OnModuleDestroy {
    private redis: Redis;

    constructor(
        private configService: ConfigService,
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
        @InjectRepository(Model)
        private modelRepository: Repository<Model>,
        private readonly scorerService: ScorerService,
        private readonly usersService: UsersService,
        private readonly examsService: ExamsService,
    ) {
        // Initializing Redis connection
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
        });
    }

    onModuleInit() {
        console.log('Redis persistence initialized');
    }

    onModuleDestroy() {
        this.redis.disconnect();
    }

    private getSessionKey(userId: string, testId: string) {
        return `session:${userId}:${testId}`;
    }

    async createAdaptiveSession(userId: string, questions: any[]): Promise<TestSession> {
        // Generate a unique session ID
        const sessionId = `adaptive-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const key = this.getSessionKey(userId, sessionId);

        const durationSeconds = 30 * 60; // 30 minutes for adaptive
        const newSession: TestSession = {
            userId,
            testId: sessionId,
            startTime: Date.now(),
            answers: {},
            timings: {},
            flags: [],
            status: 'IN_PROGRESS',
            questions,
            durationSeconds
        };

        const redisExpiry = durationSeconds + (60 * 60);
        await this.redis.set(key, JSON.stringify(newSession), 'EX', redisExpiry);
        return newSession;
    }

    async startSession(userId: string, testId: string): Promise<TestSession> {
        console.log(`[TestSessionService] startSession called for ${testId}`);
        const key = this.getSessionKey(userId, testId);
        const existingSession = await this.redis.get(key);

        if (existingSession) {
            console.log(`[TestSessionService] Found existing session in Redis.`);
            const session: TestSession = JSON.parse(existingSession);
            if (session.status !== 'COMPLETED') {
                // If it's a standard test (not adaptive), we need to re-attach questions
                // because they are not stored in Redis to save space.
                if (!testId.startsWith('adaptive')) {
                    try {
                        const model = await this.examsService.findModel(testId);
                        if (model && model.questions) {
                            return {
                                ...session,
                                questions: model.questions
                            };
                        }
                    } catch (e) {
                        console.error(`[TestSessionService] Error fetching questions for existing session:`, e);
                    }
                }
                return session;
            }
        }

        if (testId.startsWith('adaptive')) {
            console.warn(`[TestSessionService] Adaptive session requested but not found in Redis. ID: ${testId}`);
            throw new NotFoundException('Adaptive session not found or expired.');
        }

        console.log(`[TestSessionService] Starting standard session for Model ID: ${testId}`);
        let durationSeconds = 60 * 60; // Default 1 hour
        let questions: any[] = [];

        try {
            // Find model with questions
            // [FIX] Strip prefix if it exists before calling findModel/findOne
            const cleanId = testId.startsWith('chapter-') ? testId.replace('chapter-', '') : testId;
            console.log(`[TestSessionService] Lookup ID: ${cleanId} (original: ${testId})`);

            let model: any = await this.examsService.findModel(cleanId);

            // [FIX] Fallback for Chapter Practice: Calculate duration based on Chapter's questions
            if (!model && testId.startsWith('chapter-')) {
                console.log(`[TestSessionService] Performing dedicated Chapter lookup for duration: ${cleanId}`);
                try {
                    const chapterQuestions = await this.examsService.getPracticeQuestions(userId, cleanId, 20); // Default limit matching startPractice
                    if (chapterQuestions && chapterQuestions.length > 0) {
                        model = {
                            title: 'Chapter Practice',
                            questions: chapterQuestions,
                            duration: chapterQuestions.length * 2,
                            totalQuestions: chapterQuestions.length
                        };
                        console.log(`[TestSessionService] Created dynamic Model for Chapter Practice. Questions: ${chapterQuestions.length}`);
                    }
                } catch (chapterErr) {
                    console.error(`[TestSessionService] Failed to fetch practice questions for chapter:`, chapterErr);
                }
            }

            // [FIX] Fallback: If not found as Model, try finding as Exam (Full Mock)
            if (!model) {
                console.log(`[TestSessionService] Model not found for ${cleanId}, trying as Exam...`);
                const exam = await this.examsService.findOne(cleanId);
                if (exam) {
                    console.log(`[TestSessionService] Found Exam: ${exam.title}`);
                    model = {
                        ...exam,
                        duration: exam.duration || 60,
                        totalQuestions: exam.questions?.length || 0
                    };
                }
            }

            if (model) {
                // Check 'scheduledAt' (legacy/model-specific)
                if (model.scheduledAt) {
                    const now = new Date();
                    const scheduledTime = new Date(model.scheduledAt);
                    if (now < scheduledTime) {
                        throw new Error(`This test is scheduled for ${scheduledTime.toLocaleString()}. Please wait.`);
                    }
                }

                // Check 'startTime' (Live Exam standard)
                if (model.startTime) {
                    const now = new Date();
                    const startTime = new Date(model.startTime);

                    // If it has an endTime, checking validity window
                    if (model.endTime) {
                        const endTime = new Date(model.endTime);
                        if (now > endTime) {
                            throw new Error(`This event ended on ${endTime.toLocaleString()}.`);
                        }
                    }

                    if (now < startTime) {
                        throw new Error(`This live event starts at ${startTime.toLocaleString()}. Please wait.`);
                    }
                }
                durationSeconds = (model.duration * 60); // Use model duration directly

                // Add a buffer for Redis expiry but not for the test timer
                const redisExpiry = durationSeconds + (60 * 60);

                // Assuming model.questions are loaded by findModel (which they are, per ExamsService)
                if (model.questions) {
                    questions = model.questions;
                }

                // [NEW] Logic for Chapter Practice dynamic duration
                if (testId.startsWith('chapter-')) {
                    const calculatedDuration = questions.length * 2 * 60; // 2 mins per question
                    durationSeconds = calculatedDuration;
                    console.log(`[TestSessionService] Calculated Chapter Practice duration: ${durationSeconds}s for ${questions.length} questions`);
                }
            } else {
                console.warn(`[TestSessionService] No Model or Exam found for ID: ${testId}`);
            }
        } catch (e) {
            console.error(`[TestSessionService] Error fetching model/exam:`, e);
            // Fallback continues
        }

        const newSession: TestSession = {
            userId,
            testId,
            startTime: Date.now(),
            answers: {},
            timings: {},
            flags: [],
            status: 'IN_PROGRESS',
            durationSeconds: durationSeconds,
            questions: testId.startsWith('chapter-') ? questions : undefined
        };

        const redisExpiry = durationSeconds + (60 * 60);
        await this.redis.set(key, JSON.stringify(newSession), 'EX', redisExpiry);

        // return session WITH questions (but don't store questions in Redis for standard tests)
        return {
            ...newSession,
            questions: questions
        };
    }

    /**
     * Start a session for Chapter Wise Practice
     * testId will be `chapter-${chapterId}` to distinguish from exam models
     */
    async startChapterSession(userId: string, chapterId: string): Promise<TestSession> {
        const testId = `chapter-${chapterId}`;
        const key = this.getSessionKey(userId, testId);
        const existingSession = await this.redis.get(key);

        if (existingSession) {
            const session: TestSession = JSON.parse(existingSession);
            if (session.status !== 'COMPLETED') {
                return session;
            }
        }

        // Fetch questions for this chapter to validate and store if needed
        // For practice, we might want to store question IDs in session so we know what they practiced?
        // Or client just fetches all questions.
        // Let's just create the session marker. Client fetches questions via /exams/chapters/:id/questions

        const newSession: TestSession = {
            userId,
            testId,
            startTime: Date.now(),
            answers: {},
            timings: {},
            flags: [],
            status: 'IN_PROGRESS',
        };

        // Standard practice duration is 1 hour + buffer
        await this.redis.set(key, JSON.stringify(newSession), 'EX', 60 * 60 * 2);
        return newSession;
    }

    async saveAnswer(userId: string, testId: string, questionId: string, answerId: string) {
        const key = this.getSessionKey(userId, testId);
        const sessionData = await this.redis.get(key);

        if (!sessionData) {
            throw new Error('Session not found');
        }

        const session: TestSession = JSON.parse(sessionData);
        if (session.status === 'COMPLETED') {
            throw new Error('Test already submitted');
        }

        session.answers[questionId] = answerId;

        await this.redis.set(key, JSON.stringify(session), 'KEEPTTL'); // Keep existing expiration
        return session;
    }

    async syncProgress(userId: string, testId: string, answers: Record<string, string>, timings: Record<string, number>) {
        const key = this.getSessionKey(userId, testId);
        const sessionData = await this.redis.get(key);

        if (!sessionData) {
            throw new Error('Session not found');
        }

        const session: TestSession = JSON.parse(sessionData);
        if (session.status === 'COMPLETED') {
            throw new Error('Test already submitted');
        }

        // Merge progress
        session.answers = { ...session.answers, ...answers };
        session.timings = { ...session.timings, ...timings };

        await this.redis.set(key, JSON.stringify(session), 'KEEPTTL');
        return session;
    }

    async toggleFlag(userId: string, testId: string, questionId: string) {
        const key = this.getSessionKey(userId, testId);
        const sessionData = await this.redis.get(key);

        if (!sessionData) throw new Error('Session not found');

        const session: TestSession = JSON.parse(sessionData);
        if (session.status === 'COMPLETED') throw new Error('Test already submitted');

        if (!session.flags) session.flags = [];

        const index = session.flags.indexOf(questionId);
        if (index > -1) {
            session.flags.splice(index, 1);
        } else {
            session.flags.push(questionId);
        }

        await this.redis.set(key, JSON.stringify(session), 'KEEPTTL');
        return session;
    }

    async getSession(userId: string, testId: string): Promise<TestSession | null> {
        const key = this.getSessionKey(userId, testId);
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async completeSession(userId: string, testId: string, timings: Record<string, number> = {}, answers?: Record<string, string>) {
        console.log(`[TestSession] Completing session. User: ${userId}, Test: ${testId}`);
        const key = this.getSessionKey(userId, testId);
        const sessionData = await this.redis.get(key);
        if (!sessionData) {
            console.error(`[TestSession] Session not found in Redis for key: ${key}`);
            throw new NotFoundException('Session expired or invalid');
        }

        const session: TestSession = JSON.parse(sessionData);

        console.log(`[TestSession] Session parsed. Answers count: ${Object.keys(session.answers).length}, Timings count: ${Object.keys(timings).length}`);


        // 1. Grade and Persist to Postgres
        try {
            console.log(`[TestSession] Fetching user ${userId}`);
            const user = await this.usersService.findOneById(userId);
            if (!user) {
                console.error(`[TestSession] User not found: ${userId}`);
                throw new Error("User not found");
            }

            let modelTitle = 'Adaptive AI Practice';
            console.log(`[TestSession] Checking model for ${testId}`);

            if (!testId.startsWith('adaptive')) {
                const cleanId = testId.startsWith('chapter-') ? testId.replace('chapter-', '') : testId;
                const model = await this.modelRepository.findOne({
                    where: { id: cleanId }
                });
                if (model) {
                    modelTitle = model.title;
                    console.log(`[TestSession] Model identified: ${modelTitle}`);
                }
            }

            const finalAnswers = answers || session.answers;
            console.log(`[TestSession] Final answers for scoring: ${Object.keys(finalAnswers).length}`);

            // Calculate actual total duration for the scorer
            let totalTimeSpent = session.accumulatedTime || 0;
            if (session.status !== 'PAUSED') {
                totalTimeSpent += Math.floor((Date.now() - session.startTime) / 1000);
            }
            const virtualStartTime = Date.now() - (totalTimeSpent * 1000);

            console.log(`[TestSession] Calling ScorerService.gradeAndSave... (Duration: ${totalTimeSpent}s)`);
            const attempt = await this.scorerService.gradeAndSave(
                user,
                testId,
                finalAnswers,
                virtualStartTime,
                timings,
                session.flags,
                session.questions ? session.questions.map(q => q.id) : []
            );

            session.status = 'COMPLETED'; // Set after calculation


            console.log(`[TestSession] ScorerService returned Attempt ID: ${attempt.id}`);

            // 2. Persist state in Redis
            // Mark as completed in Redis so they can't resume
            await this.redis.set(key, JSON.stringify(session), 'EX', 60 * 60 * 24);

            // 3. Publish to Kafka (Resilient & Non-blocking)
            try {
                console.log(`[TestSession] Emitting to Kafka...`);
                this.kafkaClient.emit('test_submission', {
                    ...session,
                    attemptId: attempt.id,
                    submittedAt: Date.now()
                }).subscribe({
                    next: () => console.log('[TestSession] Kafka emission successful'),
                    error: (err) => console.error('[TestSession] Kafka emission error:', err)
                });
                console.log(`[TestSession] Kafka emit triggered.`);
            } catch (kafkaErr) {
                console.error('[TestSession] Kafka sync error:', kafkaErr);
            }

            return {
                ...session,
                attemptId: attempt.id,
                score: attempt.score,
                correctAnswers: attempt.correctAnswers,
                totalQuestions: attempt.totalQuestions
            };
        } catch (err: any) {
            console.error(`[TestSession] Error during grading/saving:`, err);
            throw new InternalServerErrorException(err.message || 'Error during grading/saving');
        }
    }

    async getUserActiveSessions(userId: string): Promise<Record<string, 'IN_PROGRESS' | 'PAUSED'>> {
        const pattern = `session:${userId}:*`;
        const keys = await this.redis.keys(pattern);
        const activeSessions: Record<string, 'IN_PROGRESS' | 'PAUSED'> = {};

        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const session: TestSession = JSON.parse(data);
                if (session.status === 'IN_PROGRESS' || session.status === 'PAUSED') {
                    activeSessions[session.testId] = session.status;
                }
            }
        }
        return activeSessions;
    }

    async pauseSession(userId: string, testId: string) {
        const session = await this.getSession(userId, testId);
        if (!session) throw new NotFoundException('Session not found');
        if (session.status !== 'IN_PROGRESS') throw new Error('Only in-progress sessions can be paused');

        const now = Date.now();
        const elapsedSinceLastResume = Math.floor((now - session.startTime) / 1000);

        session.status = 'PAUSED';
        session.pausedAt = now;
        session.accumulatedTime = (session.accumulatedTime || 0) + elapsedSinceLastResume;

        const key = this.getSessionKey(userId, testId);
        await this.redis.set(key, JSON.stringify(session), 'KEEPTTL');
        return session;
    }

    async resumeSession(userId: string, testId: string) {
        const session = await this.getSession(userId, testId);
        if (!session) throw new NotFoundException('Session not found');
        if (session.status !== 'PAUSED') throw new Error('Only paused sessions can be resumed');

        session.status = 'IN_PROGRESS';
        session.startTime = Date.now();
        session.pausedAt = undefined;

        const key = this.getSessionKey(userId, testId);
        await this.redis.set(key, JSON.stringify(session), 'KEEPTTL');
        return session;
    }
}

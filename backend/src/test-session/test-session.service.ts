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
    answers: Record<string, string>; // questionId -> optionId
    flags: string[]; // array of questionId
    status: 'IN_PROGRESS' | 'COMPLETED';
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

    async startSession(userId: string, testId: string): Promise<TestSession> {
        const key = this.getSessionKey(userId, testId);
        const existingSession = await this.redis.get(key);

        if (existingSession) {
            return JSON.parse(existingSession);
        }

        // Adaptive sessions are handled dynamically
        if (testId.startsWith('adaptive')) {
            const newSession: TestSession = {
                userId,
                testId,
                startTime: Date.now(),
                answers: {},
                flags: [],
                status: 'IN_PROGRESS',
            };
            await this.redis.set(key, JSON.stringify(newSession), 'EX', 60 * 60 * 2);
            return newSession;
        }

        // Check scheduling for regular models
        const model = await this.examsService.findModel(testId);
        if (model?.scheduledAt) {
            const now = new Date();
            const scheduledTime = new Date(model.scheduledAt);
            if (now < scheduledTime) {
                throw new Error(`This test is scheduled for ${scheduledTime.toLocaleString()}. Please wait.`);
            }
        }

        const newSession: TestSession = {
            userId,
            testId,
            startTime: Date.now(),
            answers: {},
            flags: [],
            status: 'IN_PROGRESS',
        };

        // Session expires in 2 hours (test duration + buffer)
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
        session.status = 'COMPLETED';

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
                const model = await this.modelRepository.findOne({
                    where: { id: testId }
                });
                if (model) {
                    modelTitle = model.title;
                    console.log(`[TestSession] Model identified: ${modelTitle}`);
                }
            }

            const finalAnswers = answers || session.answers;
            console.log(`[TestSession] Final answers for scoring: ${Object.keys(finalAnswers).length}`);

            console.log(`[TestSession] Calling ScorerService.gradeAndSave...`);
            const attempt = await this.scorerService.gradeAndSave(
                user,
                testId,
                finalAnswers,
                session.startTime,
                timings,
                session.flags
            );

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

            return { ...session, attemptId: attempt.id };
        } catch (err: any) {
            console.error(`[TestSession] Error during grading/saving:`, err);
            throw new InternalServerErrorException(err.message || 'Error during grading/saving');
        }
    }

    async getUserActiveTestIds(userId: string): Promise<string[]> {
        const pattern = `session:${userId}:*`;
        const keys = await this.redis.keys(pattern);
        const activeTestIds: string[] = [];

        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const session: TestSession = JSON.parse(data);
                if (session.status === 'IN_PROGRESS') {
                    activeTestIds.push(session.testId);
                }
            }
        }
        return activeTestIds;
    }
}

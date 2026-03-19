import { DataSource } from 'typeorm';
import { UserStats } from '../users/entities/user-stats.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Response } from '../exams/entities/response.entity';
import { Question } from '../exams/entities/question.entity';
import { User } from '../users/user.entity';
import { Model } from '../exams/entities/model.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Subject } from '../exams/entities/subject.entity';
import { Chapter } from '../exams/entities/chapter.entity';
import { UserGamification } from '../gamification/entities/user-gamification.entity';
import { DailyChallenge } from '../gamification/entities/daily-challenge.entity';
import { UserChallengeProgress } from '../gamification/entities/user-challenge-progress.entity';

import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

async function recalculate() {
    console.log('--- RECALCULATING USER STATS ---');
    
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
        entities: [
            UserStats, Attempt, Response, Question, User, Model, Exam, 
            Subject, Chapter, UserGamification, DailyChallenge, UserChallengeProgress
        ],
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('Connected to Database.');

    const userRepo = dataSource.getRepository(User);
    const attemptRepo = dataSource.getRepository(Attempt);
    const userStatsRepo = dataSource.getRepository(UserStats);
    const responseRepo = dataSource.getRepository(Response);

    const users = await userRepo.find({ select: ['id', 'fullName'] });
    console.log(`Processing stats for ${users.length} users...`);

    for (const user of users) {
        console.log(`\nUser: ${user.fullName} (${user.id})`);
        
        // Get all attempts for this user sorted by date
        const attempts = await attemptRepo.find({
            where: { user: { id: user.id } },
            order: { createdAt: 'ASC' },
            relations: ['responses', 'responses.question']
        });

        if (attempts.length === 0) {
            console.log(' - No attempts found. Skipping.');
            continue;
        }

        console.log(` - Found ${attempts.length} attempts. Recalculating...`);

        let totalAttempts = 0;
        let totalScore = 0;
        let totalQuestionsAttempted = 0;
        let totalCorrect = 0;
        let totalTimeTaken = 0;
        let currentStreak = 0;
        let lastAttemptDate: Date | null = null;
        let topicPerformance: Record<string, { correct: number; total: number }> = {};

        for (const attempt of attempts) {
            totalAttempts += 1;
            totalScore += attempt.score;
            totalQuestionsAttempted += attempt.totalQuestions;
            totalCorrect += attempt.correctAnswers;
            totalTimeTaken += attempt.timeTaken;

            // Streak Calculation
            const attemptDate = new Date(attempt.createdAt);
            const attemptDateStr = attemptDate.toISOString().split('T')[0];
            
            if (lastAttemptDate) {
                const lastDateStr = lastAttemptDate.toISOString().split('T')[0];
                const yesterday = new Date(attemptDate);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDateStr === yesterdayStr) {
                    currentStreak += 1;
                } else if (lastDateStr !== attemptDateStr) {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            lastAttemptDate = attemptDate;

            // Topic Performance from responses
            if (attempt.responses) {
                for (const resp of attempt.responses) {
                    const topic = resp.question?.topic || 'General';
                    if (!topicPerformance[topic]) topicPerformance[topic] = { correct: 0, total: 0 };
                    topicPerformance[topic].total += 1;
                    if (resp.isCorrect) topicPerformance[topic].correct += 1;
                }
            }
        }

        // Upsert into user_stats
        let stats = await userStatsRepo.findOne({ where: { userId: user.id } });
        if (!stats) {
            stats = userStatsRepo.create({ userId: user.id });
        }

        stats.totalAttempts = totalAttempts;
        stats.totalScore = totalScore;
        stats.totalQuestionsAttempted = totalQuestionsAttempted;
        stats.totalCorrect = totalCorrect;
        stats.totalTimeTaken = totalTimeTaken;
        stats.currentStreak = currentStreak;
        stats.lastAttemptDate = lastAttemptDate;
        stats.topicPerformance = topicPerformance;
        // dailyQuestionTarget should keep its default or existing value

        await userStatsRepo.save(stats);
        console.log(` - ✅ Stats saved. Streak: ${currentStreak}, Avg Score: ${(totalScore / totalAttempts).toFixed(2)}`);
    }

    console.log('\n--- RECALCULATION COMPLETE ---');
    await dataSource.destroy();
}

recalculate().catch(console.error);

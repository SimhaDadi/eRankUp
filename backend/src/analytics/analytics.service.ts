import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { CacheService } from '../common/cache.service';
import { User, UserRole } from '../users/user.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Purchase } from '../exams/entities/purchase.entity';
import { UserPass } from '../passes/entities/user-pass.entity';

import { Response } from '../exams/entities/response.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Response)
        private responseRepository: Repository<Response>,
        @InjectRepository(Purchase)
        private purchaseRepository: Repository<Purchase>,
        @InjectRepository(UserPass)
        private userPassRepository: Repository<UserPass>,
        private cacheService: CacheService,
    ) { }

    async getOverviewStats() {
        const cacheKey = 'analytics:overview';
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Active Students
        const activeStudents = await this.userRepository.count({
            where: { role: UserRole.STUDENT }
        });

        // 2. Total Exams
        const totalExams = await this.examRepository.count();

        // 3. Submissions Today
        const submissionsToday = await this.attemptRepository.count({
            where: {
                createdAt: Between(startOfDay, endOfDay)
            }
        });

        // 4. Revenue (Total Completed Purchases + Passes)
        const totalPurchasesResult = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .select('SUM(purchase.amount)', 'total')
            .where("purchase.status = 'COMPLETED'")
            .getRawOne();
        const purchaseRevenue = parseFloat(totalPurchasesResult.total) || 0;

        const totalPassesResult = await this.userPassRepository
            .createQueryBuilder('userPass')
            .select('SUM(userPass.amount)', 'total')
            .where("userPass.paymentStatus = 'COMPLETED'")
            .getRawOne();
        const passRevenue = parseFloat(totalPassesResult.total) || 0;

        const totalRevenue = purchaseRevenue + passRevenue;

        // Calculate growth (mocked for now, but could be real comparison with last month)
        const revenueStats = {
            totalRevenue,
            currency: 'INR',
            growth: '+15%' // Placeholder
        };

        const stats = {
            activeStudents,
            totalExams,
            submissionsToday,
            revenueStats
        };

        await this.cacheService.set(cacheKey, stats, 600);
        return stats;
    }

    async getUserAnalytics() {
        const cacheKey = 'analytics:users';
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        // User Growth (Last 6 months)
        const months = 6;
        const growthData = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const count = await this.userRepository.count({
                where: {
                    createdAt: Between(date, nextDate),
                    role: UserRole.STUDENT
                }
            });

            growthData.push({
                month: date.toLocaleString('default', { month: 'short' }),
                users: count
            });
        }

        // Role Distribution
        const students = await this.userRepository.count({ where: { role: UserRole.STUDENT } });
        const admins = await this.userRepository.count({ where: { role: UserRole.ADMIN } });

        const stats = {
            growth: growthData,
            distribution: [
                { name: 'Students', value: students },
                { name: 'Admins', value: admins }
            ]
        };

        await this.cacheService.set(cacheKey, stats, 600);
        return stats;
    }

    async getExamAnalytics() {
        const cacheKey = 'analytics:exams';
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        // Most Popular Exams (by attempts)
        const popularExams = await this.attemptRepository
            .createQueryBuilder('attempt')
            .leftJoinAndSelect('attempt.exam', 'exam')
            .select('exam.title', 'name')
            .addSelect('COUNT(attempt.id)', 'attempts')
            .groupBy('exam.id')
            .addGroupBy('exam.title')
            .orderBy('attempts', 'DESC')
            .limit(5)
            .getRawMany();

        // Pass Rate (Attempts with score > 40%) - Simplified logic
        // In reality, each exam has its own pass criteria
        const passedAttempts = await this.attemptRepository.createQueryBuilder('attempt')
            .where('attempt.score >= 40') // Assuming 40 is pass mark for generic stat
            .getCount();

        const totalAttempts = await this.attemptRepository.count();
        const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

        const stats = {
            popularExams: popularExams.map(e => ({ name: e.name, value: parseInt(e.attempts) })),
            passRate
        };

        await this.cacheService.set(cacheKey, stats, 600);
        return stats;
    }

    async getRevenueAnalytics() {
        const cacheKey = 'analytics:revenue';
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        // Revenue Trend (Last 6 months)
        const months = 6;
        const trendData = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const result = await this.purchaseRepository
                .createQueryBuilder('purchase')
                .select('SUM(purchase.amount)', 'total')
                .where("purchase.status = 'COMPLETED'")
                .andWhere("purchase.createdAt >= :startDate", { startDate: date })
                .andWhere("purchase.createdAt < :endDate", { endDate: nextDate })
                .getRawOne();

            trendData.push({
                month: date.toLocaleString('default', { month: 'short' }),
                revenue: parseFloat(result.total) || 0
            });
        }

        // Recent Transactions
        const recentTransactions = await this.purchaseRepository.find({
            where: { status: 'COMPLETED' },
            relations: ['user', 'exam'],
            order: { createdAt: 'DESC' },
            take: 5
        });

        const stats = {
            trend: trendData,
            recent: recentTransactions.map(t => ({
                id: t.id,
                user: t.user.fullName || t.user.email,
                exam: t.exam.title,
                amount: t.amount,
                date: t.createdAt
            }))
        };

        await this.cacheService.set(cacheKey, stats, 600);
        return stats;
    }
    async getAttemptAnalysis(attemptId: string, userId: string) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId, user: { id: userId } },
            relations: ['responses', 'responses.question', 'model', 'exam']
        });

        if (!attempt) return null;

        let betterCount = 0;
        let totalParticipants = 0;

        if (attempt.model) {
            betterCount = await this.attemptRepository.createQueryBuilder('attempt')
                .where('attempt.modelId = :modelId', { modelId: attempt.model.id })
                .andWhere(
                    '(attempt.score > :score OR (attempt.score = :score AND attempt.timeTaken < :timeTaken))',
                    { score: attempt.score, timeTaken: attempt.timeTaken }
                )
                .getCount();

            totalParticipants = await this.attemptRepository.count({
                where: { model: { id: attempt.model.id } }
            });
        } else if (attempt.exam) {
            betterCount = await this.attemptRepository.createQueryBuilder('attempt')
                .where('attempt.examId = :examId', { examId: attempt.exam.id })
                .andWhere(
                    '(attempt.score > :score OR (attempt.score = :score AND attempt.timeTaken < :timeTaken))',
                    { score: attempt.score, timeTaken: attempt.timeTaken }
                )
                .getCount();

            totalParticipants = await this.attemptRepository.count({
                where: { exam: { id: attempt.exam.id } }
            });
        }

        const topicStats: Record<string, { correct: number; total: number; time: number }> = {};

        attempt.responses.forEach(response => {
            const topic = response.question.topic || 'General';
            if (!topicStats[topic]) {
                topicStats[topic] = { correct: 0, total: 0, time: 0 };
            }

            topicStats[topic].total += 1;
            topicStats[topic].time += response.timeSpent || 0;
            if (response.isCorrect) {
                topicStats[topic].correct += 1;
            }
        });

        // Determine Strengths and Weaknesses
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        Object.entries(topicStats).forEach(([topic, stats]) => {
            const accuracy = (stats.correct / stats.total) * 100;
            if (accuracy >= 80) strengths.push(topic);
            if (accuracy <= 40) weaknesses.push(topic);
        });

        return {
            rank: betterCount + 1,
            totalParticipants,
            topicAnalysis: topicStats,
            strengths: strengths.slice(0, 3),
            weaknesses: weaknesses.slice(0, 3),
            recommendation: weaknesses.length > 0
                ? `Focus on reviewing concepts in ${weaknesses.join(', ')} to improve your score.`
                : `Great job! Maintain your performance in ${strengths.join(', ')} and try more difficult problems.`
        };
    }

    async getStudentList(page: number = 1, limit: number = 10, search: string = '') {
        const queryBuilder = this.userRepository.createQueryBuilder('user')
            .where('user.role = :role', { role: UserRole.STUDENT });

        if (search) {
            queryBuilder.andWhere('(user.email ILIKE :search OR user.fullName ILIKE :search)', { search: `%${search}%` });
        }

        const skip = (page - 1) * limit;
        const [users, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy('user.createdAt', 'DESC')
            .getManyAndCount();

        // Enrich with stats
        const students = await Promise.all(users.map(async (user) => {
            const stats = await this.attemptRepository
                .createQueryBuilder('attempt')
                .select('COUNT(attempt.id)', 'totalAttempts')
                .addSelect('AVG(attempt.accuracy)', 'averageScore')
                .where('attempt.userId = :userId', { userId: user.id })
                .getRawOne();

            return {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt,
                totalAttempts: parseInt(stats.totalAttempts) || 0,
                averageScore: Math.round(parseFloat(stats.averageScore) || 0)
            };
        }));

        return {
            students,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    async getSubjectMastery(userId: string) {
        const cacheKey = `analytics:mastery:${userId}`;
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        const rawStats = await this.responseRepository.createQueryBuilder('response')
            .innerJoin('response.attempt', 'attempt')
            .innerJoin('response.question', 'question')
            .leftJoin('question.subject', 'subject')
            .leftJoin('question.chapter', 'chapter')
            .where('attempt.userId = :userId', { userId })
            .select([
                'COALESCE(subject.title, \'General\') AS subject_name',
                'COALESCE(chapter.title, question.topic, \'General\') AS topic_name',
                'COUNT(response.id) AS total_items',
                'SUM(CASE WHEN response.isCorrect = true THEN 1 ELSE 0 END) AS correct_count',
                'AVG(response.timeSpent) AS avg_time'
            ])
            .groupBy('subject.id')
            .addGroupBy('subject.title')
            .addGroupBy('chapter.id')
            .addGroupBy('chapter.title')
            .addGroupBy('question.topic')
            .getRawMany();

        // Group by Subject
        const masteryMap = new Map<string, any>();

        for (const stat of rawStats) {
            const subject = stat.subject_name;
            const topic = stat.topic_name;
            const total = parseInt(stat.total_items);
            const correct = parseInt(stat.correct_count);
            const avgTime = parseFloat(stat.avg_time) || 0;
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

            if (!masteryMap.has(subject)) {
                masteryMap.set(subject, {
                    category: subject,
                    score: 0,
                    totalItems: 0,
                    totalCorrect: 0,
                    totalTime: 0,
                    subtopics: []
                });
            }

            const subjectData = masteryMap.get(subject);
            subjectData.totalItems += total;
            subjectData.totalCorrect += correct;
            subjectData.totalTime += avgTime * total; // Weighted sum for avg calculation later

            subjectData.subtopics.push({
                name: topic,
                accuracy: accuracy
            });
        }

        const result = Array.from(masteryMap.values()).map(subject => {
            const overallAccuracy = subject.totalItems > 0
                ? Math.round((subject.totalCorrect / subject.totalItems) * 100)
                : 0;

            const overallAvgTime = subject.totalItems > 0
                ? Math.round(subject.totalTime / subject.totalItems)
                : 0;

            // Determine status and weakness
            let status = 'Average';
            if (overallAccuracy >= 80) status = 'Strong';
            else if (overallAccuracy < 50) status = 'Weak';

            // Find weakest subtopic
            const weakestSubtopic = subject.subtopics.sort((a, b) => a.accuracy - b.accuracy)[0];
            const weakness = weakestSubtopic && weakestSubtopic.accuracy < 60 ? weakestSubtopic.name : null;

            // Format time
            const minutes = Math.floor(overallAvgTime / 60);
            const seconds = overallAvgTime % 60;
            const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

            return {
                category: subject.category,
                score: overallAccuracy,
                totalItems: subject.totalItems,
                avgTime: timeString,
                status,
                weakness,
                subtopics: subject.subtopics
            };
        });

        // Add mock benchmarks for radar chart (topperScore vs yourScore) for mobile
        // In reality, you'd calculate topper scores similarly
        const mobileFormat: any[] = result.map(r => ({
            topic: r.category,
            yourScore: r.score,
            topperScore: Math.min(100, r.score + Math.floor(Math.random() * 20) + 5), // Mock topper score
            fullData: r // Keep full data for detailed view if needed
        }));

        // We return the detailed list for web, logic in controller can split if needed or frontend handles it
        // Since mobile expects a list for radar chart, and detailed breakdown expects list of categories
        // We can check user agent or just return a unified structure?
        // Let's return the list directly, both define it as a list.

        // However, mobile radar chart expects { topic, yourScore, topperScore } objects in a list
        // Web expects { category, score, subtopics... }
        // The mobile implementation code I saw:
        // _masteryData = jsonDecode(results[2].body) as List;
        // RadarChart uses m['topperScore'] and m['yourScore']

        // I should merge this so the same response works for both, or update mobile to adapt.
        // Let's include userScore/topperScore in the main web object to satisfy mobile too.

        const unifiedResult = result.map((r, idx) => ({
            ...r,
            yourScore: r.score,
            topperScore: mobileFormat[idx].topperScore,
            topic: r.category // Mobile uses 'topic' key
        }));

        await this.cacheService.set(cacheKey, unifiedResult, 300);
        return unifiedResult;
    }
    async getStudentDetails(studentId: string) {
        const user = await this.userRepository.findOne({ where: { id: studentId } });
        if (!user) throw new Error('Student not found');

        const stats = await this.attemptRepository
            .createQueryBuilder('attempt')
            .select('COUNT(attempt.id)', 'totalAttempts')
            .addSelect('SUM(CASE WHEN attempt.score >= 40 THEN 1 ELSE 0 END)', 'passedExams')
            .addSelect('AVG(attempt.score)', 'averageScore')
            .addSelect('AVG(attempt.accuracy)', 'accuracy')
            .where('attempt.userId = :userId', { userId: studentId })
            .getRawOne();

        return {
            profile: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt,
                role: user.role
            },
            stats: {
                totalAttempts: parseInt(stats.totalAttempts) || 0,
                passedExams: parseInt(stats.passedExams) || 0,
                averageScore: Math.round(parseFloat(stats.averageScore) || 0),
                accuracy: Math.round(parseFloat(stats.accuracy) || 0)
            }
        };
    }

    async getStudentAttempts(studentId: string) {
        return this.attemptRepository.find({
            where: { user: { id: studentId } },
            relations: ['exam'],
            order: { createdAt: 'DESC' }
        });
    }

    async getStudentActivity(studentId: string) {
        // Return score trend over time
        const attempts = await this.attemptRepository.find({
            where: { user: { id: studentId } },
            select: ['score', 'createdAt'],
            order: { createdAt: 'ASC' }
        });

        return attempts.map(a => ({
            date: a.createdAt.toLocaleDateString(),
            score: Math.round(a.score)
        }));
    }
}

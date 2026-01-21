import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Purchase } from '../exams/entities/purchase.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Purchase)
        private purchaseRepository: Repository<Purchase>,
    ) { }

    async getOverviewStats() {
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

        // 4. Revenue (Total Completed Purchases)
        const totalRevenueResult = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .select('SUM(purchase.amount)', 'total')
            .where("purchase.status = 'COMPLETED'")
            .getRawOne();

        const totalRevenue = parseFloat(totalRevenueResult.total) || 0;

        // Calculate growth (mocked for now, but could be real comparison with last month)
        const revenueStats = {
            totalRevenue,
            currency: 'INR',
            growth: '+15%' // Placeholder
        };

        return {
            activeStudents,
            totalExams,
            submissionsToday,
            revenueStats
        };
    }

    async getUserAnalytics() {
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

        return {
            growth: growthData,
            distribution: [
                { name: 'Students', value: students },
                { name: 'Admins', value: admins }
            ]
        };
    }

    async getExamAnalytics() {
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

        return {
            popularExams: popularExams.map(e => ({ name: e.name, value: parseInt(e.attempts) })),
            passRate
        };
    }

    async getRevenueAnalytics() {
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

        return {
            trend: trendData,
            recent: recentTransactions.map(t => ({
                id: t.id,
                user: t.user.fullName || t.user.email,
                exam: t.exam.title,
                amount: t.amount,
                date: t.createdAt
            }))
        };
    }
    async getAttemptAnalysis(attemptId: string) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId },
            relations: ['responses', 'responses.question']
        });

        if (!attempt) return null;

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
            topicAnalysis: topicStats,
            strengths: strengths.slice(0, 3),
            weaknesses: weaknesses.slice(0, 3),
            recommendation: weaknesses.length > 0
                ? `Focus on reviewing concepts in ${weaknesses.join(', ')} to improve your score.`
                : `Great job! Maintain your performance in ${strengths.join(', ')} and try more difficult problems.`
        };
    }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt } from '../exams/entities/attempt.entity';

export interface PercentileResult {
    percentile: number;
    rank: number;
    totalStudents: number;
    userScore: number;
    averageScore: number;
    medianScore: number;
    distribution: number[];
    performanceTier: 'top' | 'above_average' | 'average' | 'below_average';
}

@Injectable()
export class PercentileService {
    constructor(
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
    ) { }

    async calculatePercentile(
        userId: string,
        examId: string
    ): Promise<PercentileResult> {
        // Get all attempts for this exam
        const allAttempts = await this.attemptRepository
            .createQueryBuilder('attempt')
            .leftJoin('attempt.user', 'user')
            .leftJoin('attempt.exam', 'exam')
            .where('exam.id = :examId', { examId })
            .select(['attempt.id', 'attempt.score', 'user.id'])
            .getMany();

        if (allAttempts.length === 0) {
            throw new Error('No attempts found for this exam');
        }

        // Get user's best score
        const userAttempts = allAttempts.filter((a: any) => a.user?.id === userId);

        if (userAttempts.length === 0) {
            throw new Error('User has not attempted this exam');
        }

        const userScore = Math.max(...userAttempts.map(a => a.score));

        // Get all scores (one per user - their best score)
        const scoresByUser = new Map<string, number>();
        allAttempts.forEach((attempt: any) => {
            const currentBest = scoresByUser.get(attempt.user.id) || 0;
            scoresByUser.set(attempt.user.id, Math.max(currentBest, attempt.score));
        });

        const allScores = Array.from(scoresByUser.values()).sort((a, b) => b - a);

        // Calculate rank (1-indexed)
        const rank = allScores.filter(s => s > userScore).length + 1;

        // Calculate percentile (0-100)
        const percentile = allScores.length > 1
            ? Math.round(((allScores.length - rank) / (allScores.length - 1)) * 100)
            : 100;

        // Calculate average and median
        const averageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        const medianScore = this.calculateMedian(allScores);

        // Create distribution (10 buckets: 0-10, 10-20, ..., 90-100)
        const distribution = this.createDistribution(allScores);

        // Determine performance tier
        const performanceTier = this.getPerformanceTier(percentile);

        return {
            percentile,
            rank,
            totalStudents: allScores.length,
            userScore: Math.round(userScore * 100) / 100,
            averageScore: Math.round(averageScore * 100) / 100,
            medianScore: Math.round(medianScore * 100) / 100,
            distribution,
            performanceTier
        };
    }

    private calculateMedian(sortedScores: number[]): number {
        const mid = Math.floor(sortedScores.length / 2);

        if (sortedScores.length % 2 === 0) {
            return (sortedScores[mid - 1] + sortedScores[mid]) / 2;
        }

        return sortedScores[mid];
    }

    private createDistribution(scores: number[]): number[] {
        // Create 10 buckets (0-10, 10-20, ..., 90-100)
        const buckets = new Array(10).fill(0);

        scores.forEach(score => {
            const bucket = Math.min(9, Math.floor(score / 10));
            buckets[bucket]++;
        });

        return buckets;
    }

    private getPerformanceTier(percentile: number): 'top' | 'above_average' | 'average' | 'below_average' {
        if (percentile >= 90) return 'top';
        if (percentile >= 70) return 'above_average';
        if (percentile >= 40) return 'average';
        return 'below_average';
    }

    /**
     * Get percentile for a specific model/test
     */
    async calculateModelPercentile(
        userId: string,
        modelId: string
    ): Promise<PercentileResult> {
        const allAttempts = await this.attemptRepository
            .createQueryBuilder('attempt')
            .leftJoin('attempt.user', 'user')
            .leftJoin('attempt.model', 'model')
            .where('model.id = :modelId', { modelId })
            .select(['attempt.id', 'attempt.score', 'user.id'])
            .getMany();

        if (allAttempts.length === 0) {
            throw new Error('No attempts found for this test');
        }

        const userAttempts = allAttempts.filter((a: any) => a.user?.id === userId);

        if (userAttempts.length === 0) {
            throw new Error('User has not attempted this test');
        }

        const userScore = Math.max(...userAttempts.map(a => a.score));

        const scoresByUser = new Map<string, number>();
        allAttempts.forEach((attempt: any) => {
            const currentBest = scoresByUser.get(attempt.user.id) || 0;
            scoresByUser.set(attempt.user.id, Math.max(currentBest, attempt.score));
        });

        const allScores = Array.from(scoresByUser.values()).sort((a, b) => b - a);
        const rank = allScores.filter(s => s > userScore).length + 1;
        const percentile = allScores.length > 1
            ? Math.round(((allScores.length - rank) / (allScores.length - 1)) * 100)
            : 100;

        const averageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        const medianScore = this.calculateMedian(allScores);
        const distribution = this.createDistribution(allScores);
        const performanceTier = this.getPerformanceTier(percentile);

        return {
            percentile,
            rank,
            totalStudents: allScores.length,
            userScore: Math.round(userScore * 100) / 100,
            averageScore: Math.round(averageScore * 100) / 100,
            medianScore: Math.round(medianScore * 100) / 100,
            distribution,
            performanceTier
        };
    }

    /**
     * Calculate percentile by attempt ID
     * Automatically determines the correct model for comparison
     */
    async calculatePercentileByAttempt(
        attemptId: string,
        userId: string
    ): Promise<PercentileResult> {
        // Get the attempt to find the model
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId },
            relations: ['model', 'user']
        });

        if (!attempt) {
            throw new Error('Attempt not found');
        }

        // Verify the attempt belongs to the user
        if (attempt.user.id !== userId) {
            throw new Error('Unauthorized access to attempt');
        }

        if (!attempt.model) {
            throw new Error('Attempt has no associated model/test');
        }

        // Calculate percentile for the model
        return this.calculateModelPercentile(userId, attempt.model.id);
    }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Response } from '../exams/entities/response.entity';
import { Question } from '../exams/entities/question.entity';
import { Attempt } from '../exams/entities/attempt.entity';

@Injectable()
export class RevisionService {
    constructor(
        @InjectRepository(Response)
        private responseRepo: Repository<Response>,
        @InjectRepository(Question)
        private questionRepo: Repository<Question>,
    ) { }

    async getRecentMistakes(userId: string, days: number = 90) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - days);

        // We join Attempt to filter by userId
        const attempts = await this.responseRepo.manager.createQueryBuilder(Attempt, 'attempt')
            .select('attempt.id')
            .where('attempt.user = :userId', { userId }) // Use relation for better compatibility
            .andWhere('attempt.createdAt > :checkDate', { checkDate })
            .getMany();

        console.log(`[RevisionService] Found ${attempts.length} attempts for user ${userId} since ${checkDate}`);
        if (attempts.length === 0) return [];

        const attemptIds = attempts.map(a => a.id);

        const results = await this.responseRepo.find({
            where: {
                attempt: { id: In(attemptIds) },
                isCorrect: false
            },
            relations: ['question'],
            order: { answeredAt: 'DESC' },
            take: 20 // Limit to top 20 recent mistakes
        });

        console.log(`[RevisionService] Returning ${results.length} specific mistakes for user ${userId}`);
        return results;
    }

    async generateRevisionPayload(userId: string) {
        const mistakes = await this.getRecentMistakes(userId);

        if (mistakes.length === 0) {
            return {
                available: false,
                message: "Great job! No recent mistakes found. Keep practicing new topics."
            };
        }

        return {
            available: true,
            questionCount: mistakes.length,
            message: `We found ${mistakes.length} questions you struggled with recently.`,
            questions: mistakes.map(m => m.question),
            origin: 'smart_revision'
        };
    }
}

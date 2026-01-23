import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';

@Injectable()
export class DifficultyService {
    constructor(
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
    ) { }

    async updateQuestionStats(questionId: string, isCorrect: boolean) {
        const question = await this.questionRepository.findOneBy({ id: questionId });
        if (!question) return;

        question.totalAttempts += 1;
        if (isCorrect) {
            question.correctCount += 1;
        }

        // Recalculate difficulty weight (0.0 easy to 1.0 hard)
        // Formula: 1.0 - success_rate
        const successRate = question.correctCount / question.totalAttempts;
        question.difficultyWeight = 1.0 - successRate;

        await this.questionRepository.save(question);
    }

    async bulkUpdateStats(results: { questionId: string; isCorrect: boolean }[]) {
        const stats = new Map<string, { total: number; correct: number }>();

        // Aggregate locally first
        for (const res of results) {
            const current = stats.get(res.questionId) || { total: 0, correct: 0 };
            current.total++;
            if (res.isCorrect) current.correct++;
            stats.set(res.questionId, current);
        }

        // Apply updates
        const promises = Array.from(stats.entries()).map(async ([questionId, update]) => {
            const question = await this.questionRepository.findOneBy({ id: questionId });
            if (!question) return;

            question.totalAttempts += update.total;
            question.correctCount += update.correct;

            // Recalculate difficulty
            if (question.totalAttempts > 0) {
                const successRate = question.correctCount / question.totalAttempts;
                question.difficultyWeight = 1.0 - successRate;
            }

            return this.questionRepository.save(question);
        });

        await Promise.all(promises);
    }
}

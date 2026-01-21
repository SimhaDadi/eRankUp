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
        // For large scale, we should use a more efficient query or batching
        for (const res of results) {
            await this.updateQuestionStats(res.questionId, res.isCorrect);
        }
    }
}

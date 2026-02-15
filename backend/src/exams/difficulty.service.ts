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

    async updateQuestionStats(questionId: string, isCorrect: boolean, timeSpent?: number) {
        const question = await this.questionRepository.findOneBy({ id: questionId });
        if (!question) return;

        question.totalAttempts += 1;
        if (isCorrect) {
            const currentCorrect = question.correctCount;
            question.correctCount += 1;

            if (timeSpent && timeSpent > 0) {
                // Moving average: (currentAvg * count + newTime) / (count + 1)
                question.avgTopperTime = (question.avgTopperTime * currentCorrect + timeSpent) / question.correctCount;
            }
        }

        // Recalculate difficulty weight (0.0 easy to 1.0 hard)
        const successRate = question.correctCount / question.totalAttempts;
        question.difficultyWeight = 1.0 - successRate;

        await this.questionRepository.save(question);
    }

    async bulkUpdateStats(results: { questionId: string; isCorrect: boolean; timeSpent?: number }[]) {
        const stats = new Map<string, { total: number; correct: number; totalCorrectTime: number }>();

        // Aggregate locally first
        for (const res of results) {
            const current = stats.get(res.questionId) || { total: 0, correct: 0, totalCorrectTime: 0 };
            current.total++;
            if (res.isCorrect) {
                current.correct++;
                if (res.timeSpent) current.totalCorrectTime += res.timeSpent;
            }
            stats.set(res.questionId, current);
        }

        // Apply updates
        const promises = Array.from(stats.entries()).map(async ([questionId, update]) => {
            const question = await this.questionRepository.findOneBy({ id: questionId });
            if (!question) return;

            const oldCorrect = question.correctCount;
            question.totalAttempts += update.total;
            question.correctCount += update.correct;

            // Update topper time (weighted average)
            if (update.correct > 0) {
                const totalCorrectTime = (question.avgTopperTime * oldCorrect) + update.totalCorrectTime;
                question.avgTopperTime = totalCorrectTime / question.correctCount;
            }

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

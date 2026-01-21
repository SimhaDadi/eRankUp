/**
 * Migration Helper: Convert legacy userAnswers to Response entities
 * Run this once to migrate existing attempt data to the new Response structure
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt } from '../exams/entities/attempt.entity';
import { Response } from '../exams/entities/response.entity';
import { Question } from '../exams/entities/question.entity';

@Injectable()
export class MigrationService {
    constructor(
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Response)
        private responseRepository: Repository<Response>,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
    ) { }

    /**
     * Migrate legacy userAnswers JSON to Response entities
     */
    async migrateUserAnswersToResponses(): Promise<{ migrated: number; skipped: number }> {
        const attempts = await this.attemptRepository.find({
            relations: ['model', 'model.questions']
        });

        let migrated = 0;
        let skipped = 0;

        for (const attempt of attempts) {
            // Skip if already has responses
            const existingResponses = await this.responseRepository.count({
                where: { attempt: { id: attempt.id } }
            });

            if (existingResponses > 0) {
                skipped++;
                continue;
            }

            // Skip if no userAnswers
            if (!attempt.userAnswers || Object.keys(attempt.userAnswers).length === 0) {
                skipped++;
                continue;
            }

            const questions = attempt.model?.questions || [];
            const responses: Response[] = [];

            for (const question of questions) {
                const selectedOptionId = attempt.userAnswers[question.id];
                if (!selectedOptionId) continue;

                const isCorrect = selectedOptionId === question.correctOptionId;
                const timeSpent = attempt.questionTimings?.[question.id] || null;

                const response = this.responseRepository.create({
                    attempt,
                    question,
                    selectedOptionId,
                    isCorrect,
                    timeSpent,
                    wasSkipped: false,
                    wasReviewed: false
                });

                responses.push(response);
            }

            if (responses.length > 0) {
                await this.responseRepository.save(responses);
                migrated++;
            }
        }

        return { migrated, skipped };
    }
}

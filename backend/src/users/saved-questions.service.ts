import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedQuestion } from './saved-question.entity';
import { Question } from '../exams/entities/question.entity';

@Injectable()
export class SavedQuestionsService {
    constructor(
        @InjectRepository(SavedQuestion)
        private savedQuestionsRepository: Repository<SavedQuestion>,
        @InjectRepository(Question)
        private questionsRepository: Repository<Question>,
    ) { }

    async toggleSave(userId: string, questionId: string): Promise<{ saved: boolean }> {
        console.log(`[SavedQuestions] Toggle save request - User: ${userId}, Question: ${questionId}`);
        const existing = await this.savedQuestionsRepository.findOne({
            where: { userId, questionId }
        });

        if (existing) {
            console.log(`[SavedQuestions] Found existing bookmark, removing: ${existing.id}`);
            await this.savedQuestionsRepository.remove(existing);
            return { saved: false };
        } else {
            console.log(`[SavedQuestions] No existing bookmark, creating new...`);
            const question = await this.questionsRepository.findOne({ where: { id: questionId } });
            if (!question) {
                console.error(`[SavedQuestions] Question NOT FOUND: ${questionId}`);
                throw new NotFoundException('Question not found');
            }

            const saved = this.savedQuestionsRepository.create({ userId, questionId });
            await this.savedQuestionsRepository.save(saved);
            console.log(`[SavedQuestions] Bookmark saved successfully: ${saved.id}`);
            return { saved: true };
        }
    }

    async getSavedQuestions(userId: string) {
        return this.savedQuestionsRepository.find({
            where: { userId },
            relations: ['question'],
            order: { createdAt: 'DESC' }
        });
    }

    async isSaved(userId: string, questionId: string): Promise<boolean> {
        const count = await this.savedQuestionsRepository.count({
            where: { userId, questionId }
        });
        return count > 0;
    }
}

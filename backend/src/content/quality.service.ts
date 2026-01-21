import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionFlag } from './entities/question-flag.entity';
import { Question } from '../exams/entities/question.entity';

@Injectable()
export class QualityService {
    constructor(
        @InjectRepository(QuestionFlag)
        private flagRepository: Repository<QuestionFlag>,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
    ) { }

    async flagQuestion(userId: string, questionId: string, reason: string, description: string) {
        // Verify question exists
        const question = await this.questionRepository.findOne({ where: { id: questionId } });
        if (!question) {
            throw new Error('Question not found');
        }

        const flag = this.flagRepository.create({
            question: { id: questionId },
            reportedBy: { id: userId },
            reason,
            description,
            status: 'pending'
        });

        return this.flagRepository.save(flag);
    }

    async getFlaggedQuestions(page: number = 1, limit: number = 20, status?: string) {
        const queryBuilder = this.flagRepository.createQueryBuilder('flag')
            .leftJoinAndSelect('flag.question', 'question')
            .leftJoinAndSelect('flag.reportedBy', 'user')
            .orderBy('flag.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status && status !== 'ALL') {
            queryBuilder.where('flag.status = :status', { status });
        }

        const [flags, total] = await queryBuilder.getManyAndCount();

        return {
            flags: flags.map(f => ({
                id: f.id,
                questionId: f.question.id,
                questionPreview: f.question.content.substring(0, 100) + '...',
                reason: f.reason,
                description: f.description,
                reportedBy: f.reportedBy.fullName || f.reportedBy.email,
                status: f.status,
                createdAt: f.createdAt,
                adminNotes: f.adminNotes
            })),
            total,
            page,
            limit
        };
    }

    async updateFlagStatus(flagId: string, status: 'reviewed' | 'resolved' | 'dismissed', adminNotes?: string) {
        const flag = await this.flagRepository.findOne({ where: { id: flagId } });
        if (!flag) {
            throw new Error('Flag not found');
        }

        flag.status = status;
        if (adminNotes) {
            flag.adminNotes = adminNotes;
        }

        return this.flagRepository.save(flag);
    }

    async getStats() {
        const total = await this.flagRepository.count();
        const pending = await this.flagRepository.count({ where: { status: 'pending' } });
        const resolved = await this.flagRepository.count({ where: { status: 'resolved' } });

        return { total, pending, resolved };
    }
}

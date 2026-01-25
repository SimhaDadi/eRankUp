import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../exams/entities/exam.entity';

@Injectable()
export class LiveExamsService {
    constructor(
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
    ) { }

    /**
     * Toggle live exam status
     */
    async toggleLiveStatus(examId: string, data: {
        isLive: boolean;
        startTime?: Date;
        endTime?: Date;
    }) {
        const exam = await this.examRepository.findOne({ where: { id: examId } });

        if (!exam) {
            throw new Error('Exam not found');
        }

        // Update exam live status
        exam.isLive = data.isLive;

        if (data.startTime) {
            exam.startTime = data.startTime;
        }

        if (data.endTime) {
            exam.endTime = data.endTime;
        }

        await this.examRepository.save(exam);

        return {
            success: true,
            message: `Exam ${data.isLive ? 'activated' : 'deactivated'} successfully`,
            exam: {
                id: exam.id,
                title: exam.title,
                isLive: exam.isLive,
                startTime: exam.startTime,
                endTime: exam.endTime
            }
        };
    }
}

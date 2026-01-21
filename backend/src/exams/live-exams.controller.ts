import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between, IsNull, Not } from 'typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin/live-exams')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class LiveExamsController {
    constructor(
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
    ) { }

    @Get()
    async getLiveExams() {
        return this.examRepository.find({
            where: {
                startTime: Not(IsNull()),
                endTime: Not(IsNull())
            },
            order: { startTime: 'ASC' }
        });
    }

    @Post()
    async scheduleExam(@Body() body: { examId: string; startTime: string; endTime: string }) {
        const exam = await this.examRepository.findOne({ where: { id: body.examId } });
        if (!exam) {
            throw new Error('Exam not found');
        }

        exam.startTime = new Date(body.startTime);
        exam.endTime = new Date(body.endTime);

        return this.examRepository.save(exam);
    }

    @Put(':id')
    async updateSchedule(
        @Param('id') id: string,
        @Body() body: { startTime: string; endTime: string }
    ) {
        const exam = await this.examRepository.findOne({ where: { id } });
        if (!exam) {
            throw new Error('Exam not found');
        }

        exam.startTime = new Date(body.startTime);
        exam.endTime = new Date(body.endTime);

        return this.examRepository.save(exam);
    }

    @Post(':id/publish')
    async publishResults(@Param('id') id: string) {
        // Placeholder for result publication logic (e.g., calculating ranks, sending notifications)
        // For now, we just ensure the exam is ended
        const exam = await this.examRepository.findOne({ where: { id } });
        if (!exam) {
            throw new Error('Exam not found');
        }

        // Logic to finalize results would go here
        return { message: 'Results published successfully' };
    }
}

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';

@Controller('subjects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SubjectsController {
    constructor(
        @InjectRepository(Subject)
        private subjectRepository: Repository<Subject>,
    ) { }

    @Get()
    async getAllSubjects() {
        return this.subjectRepository.find({ relations: ['exam'] });
    }

    @Get('by-exam/:examId')
    async getSubjectsByExam(@Param('examId') examId: string) {
        return this.subjectRepository.find({
            where: { exam: { id: examId } },
            relations: ['chapters'],
            order: { title: 'ASC' }
        });
    }

    @Get(':id')
    async getSubject(@Param('id') id: string) {
        return this.subjectRepository.findOne({
            where: { id },
            relations: ['exam', 'chapters']
        });
    }

    @Post()
    @Roles(UserRole.ADMIN)
    async createSubject(@Body() subjectData: { name: string; examId: string }) {
        const subject = this.subjectRepository.create({
            title: subjectData.name,
            exam: { id: subjectData.examId }
        });
        return this.subjectRepository.save(subject);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    async updateSubject(
        @Param('id') id: string,
        @Body() subjectData: { name?: string; examId?: string }
    ) {
        const updateData: any = {};
        if (subjectData.name) updateData.title = subjectData.name;
        if (subjectData.examId) updateData.exam = { id: subjectData.examId };

        await this.subjectRepository.update(id, updateData);
        return this.getSubject(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async deleteSubject(@Param('id') id: string) {
        await this.subjectRepository.delete(id);
        return { message: 'Subject deleted successfully' };
    }
}

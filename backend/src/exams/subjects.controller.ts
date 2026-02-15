import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ExamsService } from './exams.service';
import { CreateSubjectDto } from '@erankup/shared';

@Controller('subjects')
export class SubjectsController {
    constructor(
        private readonly examsService: ExamsService,
    ) { }

    @Get()
    async getAllSubjects() {
        console.log('[DEBUG_API] Hit SubjectsController.getAllSubjects');
        return this.examsService.findAllSubjects();
    }

    @Get('by-exam/:examId')
    async getSubjectsByExam(@Param('examId') examId: string) {
        // This logic is currently in service as part of findOne? 
        // No, let's keep it here but we could move it to service if needed.
        // For now, let's use the service if it had it, but it doesn't have "findSubjectsByExam".
        // Let's add it to service or keep direct repo if it's "simple".
        // Actually, standardization means everything goes through Service.
        return this.examsService.findSubjectsByExam(examId);
    }

    @Get(':id')
    async getSubject(@Param('id') id: string) {
        return this.examsService.findOneSubject(id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    async createSubject(@Body() subjectData: CreateSubjectDto) {
        return this.examsService.createSubject(subjectData);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    async updateSubject(
        @Param('id') id: string,
        @Body() subjectData: any
    ) {
        return this.examsService.updateSubject(id, subjectData);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async deleteSubject(@Param('id') id: string) {
        return this.examsService.deleteSubject(id);
    }
}

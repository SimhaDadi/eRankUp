import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ExamsService } from './exams.service';
import { CreateChapterDto } from '@erankup/shared';

@Controller('chapters')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ChaptersController {
    constructor(
        private readonly examsService: ExamsService,
    ) { }

    @Get()
    async getAllChapters() {
        return this.examsService.findAllChapters();
    }

    @Get('by-subject/:subjectId')
    async getChaptersBySubject(@Param('subjectId') subjectId: string) {
        return this.examsService.findChaptersBySubject(subjectId);
    }

    @Get(':id')
    async getChapter(@Param('id') id: string) {
        return this.examsService.findOneChapter(id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    async createChapter(@Body() chapterData: CreateChapterDto) {
        return this.examsService.createChapter(chapterData);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    async updateChapter(
        @Param('id') id: string,
        @Body() chapterData: any
    ) {
        return this.examsService.updateChapter(id, chapterData);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async deleteChapter(@Param('id') id: string) {
        return this.examsService.deleteChapter(id);
    }
}

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';

@Controller('chapters')
@UseGuards(AuthGuard('jwt'))
export class ChaptersController {
    constructor(
        @InjectRepository(Chapter)
        private chapterRepository: Repository<Chapter>,
    ) { }

    @Get()
    async getAllChapters() {
        return this.chapterRepository.find({ relations: ['subject'] });
    }

    @Get('by-subject/:subjectId')
    async getChaptersBySubject(@Param('subjectId') subjectId: string) {
        return this.chapterRepository.find({
            where: { subject: { id: subjectId } },
            order: { title: 'ASC' }
        });
    }

    @Get(':id')
    async getChapter(@Param('id') id: string) {
        return this.chapterRepository.findOne({
            where: { id },
            relations: ['subject']
        });
    }

    @Post()
    @Roles(UserRole.ADMIN)
    async createChapter(@Body() chapterData: { name: string; subjectId: string }) {
        const chapter = this.chapterRepository.create({
            title: chapterData.name,
            subject: { id: chapterData.subjectId }
        });
        return this.chapterRepository.save(chapter);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    async updateChapter(
        @Param('id') id: string,
        @Body() chapterData: { name?: string; subjectId?: string }
    ) {
        const updateData: any = {};
        if (chapterData.name) updateData.title = chapterData.name;
        if (chapterData.subjectId) updateData.subject = { id: chapterData.subjectId };

        await this.chapterRepository.update(id, updateData);
        return this.getChapter(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async deleteChapter(@Param('id') id: string) {
        await this.chapterRepository.delete(id);
        return { message: 'Chapter deleted successfully' };
    }
}

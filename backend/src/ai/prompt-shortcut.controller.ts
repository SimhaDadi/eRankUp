import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PromptShortcutService } from './prompt-shortcut.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateShortcutDto, UpdateShortcutDto } from './dto/prompt-shortcut.dto';

@Controller('ai/shortcuts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PromptShortcutController {
    constructor(private readonly shortcutService: PromptShortcutService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createDto: CreateShortcutDto) {
        return this.shortcutService.create(createDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.shortcutService.findAll();
    }

    @Post('generate-rule')
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FilesInterceptor('images', 5))
    async distill(
        @Body('rawText') rawText: string,
        @UploadedFiles() files: Express.Multer.File[] = [],
    ) {
        // Convert files to AI-compatible format
        const images = files ? files.map(file => ({
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        })) : [];

        return this.shortcutService.distillShortcut(rawText, images);
    }

    @Get('test-rag')
    @Roles(UserRole.ADMIN)
    testRetrieval(@Query('topic') topic: string, @Query('content') content: string) {
        return this.shortcutService.findRelevantShortcut(topic || 'General', content || '');
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateShortcutDto
    ) {
        return this.shortcutService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.shortcutService.remove(id);
    }
}

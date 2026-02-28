import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PromptShortcutService } from './prompt-shortcut.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('ai/shortcuts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PromptShortcutController {
    constructor(private readonly shortcutService: PromptShortcutService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createDto: { topic: string; formula: string; keywords?: string }) {
        return this.shortcutService.create(createDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.shortcutService.findAll();
    }

    @Post('generate-rule')
    @Roles(UserRole.ADMIN)
    distill(@Body('rawText') rawText: string) {
        return this.shortcutService.distillShortcut(rawText);
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
        @Body() updateDto: { topic?: string; formula?: string; keywords?: string; isActive?: boolean }
    ) {
        return this.shortcutService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.shortcutService.remove(id);
    }
}

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { QualityService } from './quality.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('quality')
export class QualityController {
    constructor(private readonly qualityService: QualityService) { }

    @Post('flag/:questionId')
    @UseGuards(AuthGuard('jwt'))
    async flagQuestion(
        @Request() req,
        @Param('questionId') questionId: string,
        @Body() body: { reason: string; description: string }
    ) {
        return this.qualityService.flagQuestion(req.user.userId, questionId, body.reason, body.description);
    }

    @Get('admin/flags')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getFlaggedQuestions(
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Query('status') status: string
    ) {
        return this.qualityService.getFlaggedQuestions(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            status
        );
    }

    @Put('admin/flag/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateFlagStatus(
        @Param('id') id: string,
        @Body() body: { status: 'reviewed' | 'resolved' | 'dismissed'; adminNotes?: string }
    ) {
        return this.qualityService.updateFlagStatus(id, body.status, body.adminNotes);
    }

    @Get('admin/stats')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getStats() {
        return this.qualityService.getStats();
    }
}

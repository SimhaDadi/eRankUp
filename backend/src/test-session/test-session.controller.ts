import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { TestSessionService } from './test-session.service';
import { AuthGuard } from '@nestjs/passport';
import { PremiumGuard } from '../payments/guards/premium.guard';

@Controller('test-session')
@UseGuards(AuthGuard('jwt'))
export class TestSessionController {
    constructor(private readonly sessionService: TestSessionService) { }

    @UseGuards(AuthGuard('jwt'), PremiumGuard)
    @Post('start')
    async startSession(@Request() req: any, @Body('testId') testId: string) {
        return this.sessionService.startSession(req.user.userId, testId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('start/chapter')
    async startChapterSession(@Request() req: any, @Body('chapterId') chapterId: string) {
        return this.sessionService.startChapterSession(req.user.userId, chapterId);
    }

    @UseGuards(AuthGuard('jwt'), PremiumGuard)
    @Get(':testId')
    async getSession(@Request() req: any, @Param('testId') testId: string) {
        return this.sessionService.getSession(req.user.userId, testId);
    }

    @Post(':testId/answer')
    async saveAnswer(
        @Request() req: any,
        @Param('testId') testId: string,
        @Body() body: { questionId: string; answerId: string }
    ) {
        return this.sessionService.saveAnswer(req.user.userId, testId, body.questionId, body.answerId);
    }

    @Post(':testId/sync')
    async syncProgress(
        @Request() req: any,
        @Param('testId') testId: string,
        @Body() body: { answers: Record<string, string>; timings: Record<string, number> }
    ) {
        return this.sessionService.syncProgress(req.user.userId, testId, body.answers, body.timings);
    }

    @Post(':testId/flag')
    async toggleFlag(
        @Request() req: any,
        @Param('testId') testId: string,
        @Body('questionId') questionId: string
    ) {
        return this.sessionService.toggleFlag(req.user.userId, testId, questionId);
    }

    @Post(':testId/submit')
    async submitSession(
        @Request() req: any,
        @Param('testId') testId: string,
        @Body() body: any
    ) {
        const { timings, answers } = body;
        return this.sessionService.completeSession(req.user.userId, testId, timings, answers);
    }

    @Post(':testId/pause')
    async pauseSession(@Request() req: any, @Param('testId') testId: string) {
        return this.sessionService.pauseSession(req.user.userId, testId);
    }

    @Post(':testId/resume')
    async resumeSession(@Request() req: any, @Param('testId') testId: string) {
        return this.sessionService.resumeSession(req.user.userId, testId);
    }
}

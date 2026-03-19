import { Controller, Post, Body, Get, Param, UseGuards, Request, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { TestSessionService } from './test-session.service';
import { AuthGuard } from '@nestjs/passport';
import { PremiumGuard } from '../payments/guards/premium.guard';

@Controller('test-session')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class TestSessionController {
    constructor(private readonly sessionService: TestSessionService) { }

    @UseGuards(AuthGuard('jwt'), PremiumGuard)
    @Post('start')
    async startSession(@Request() req: any, @Body('testId') testId: string) {
        return this.sessionService.startSession(req.user.userId, testId);
    }

    @UseGuards(AuthGuard('jwt'), PremiumGuard)
    @Post('start/chapter')
    async startChapterSession(@Request() req: any, @Body('chapterId') chapterId: string) {
        return this.sessionService.startChapterSession(req.user.userId, chapterId);
    }

    @UseGuards(AuthGuard('jwt'), PremiumGuard)
    @Post('start/revision')
    async startRevisionSession(@Request() req: any) {
        return this.sessionService.startRevisionSession(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'), PremiumGuard)
    @Get(':testId')
    async getSession(@Request() req: any, @Param('testId') testId: string) {
        console.log(`[TestSessionController] getSession called for ${testId}, User: ${req.user.userId}`);
        const session = await this.sessionService.getSession(req.user.userId, testId);

        if (!session) {
            console.log(`[TestSessionController] Session not found in Redis. Attempting to start new session...`);
            try {
                if (testId === 'smart-revision') {
                    return await this.sessionService.startRevisionSession(req.user.userId);
                }
                return await this.sessionService.startSession(req.user.userId, testId);
            } catch (e) {
                console.error(`[TestSessionController] startSession failed:`, e);
                throw e;
            }
        }
        return session;
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

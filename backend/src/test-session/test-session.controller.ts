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
}

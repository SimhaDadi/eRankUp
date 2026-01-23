import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdaptiveLearningService } from './adaptive-learning.service';

@Controller('adaptive')
@UseGuards(AuthGuard('jwt'))
export class AdaptiveLearningController {
    constructor(private readonly adaptiveService: AdaptiveLearningService) { }

    @Get('mastery')
    async getMastery(@Request() req: any) {
        const userId = req.user.userId;
        return this.adaptiveService.getComparisonStats(userId);
    }

    @Get('weak-areas')
    async getWeakAreas(@Request() req: any, @Query('limit') limit?: string) {
        const userId = req.user.userId;
        const limitNum = limit ? parseInt(limit) : 5;
        return this.adaptiveService.getWeakAreas(userId, limitNum);
    }

    @Post('generate-practice')
    async generatePractice(
        @Request() req: any,
        @Body() body: { examId: string; count?: number },
    ) {
        const userId = req.user.userId;
        const questions = await this.adaptiveService.generateAdaptiveQuestionSet(
            userId,
            body.examId,
            body.count || 20,
        );

        return {
            questions,
            reasoning: `Selected ${questions.length} questions focusing on your weak areas`,
        };
    }

    @Get('learning-path')
    async getLearningPath(@Request() req: any) {
        const userId = req.user.userId;
        return this.adaptiveService.generateLearningPath(userId);
    }
}

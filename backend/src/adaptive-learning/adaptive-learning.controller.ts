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
        const path = await this.adaptiveService.generateLearningPath(userId);

        // Frontend expects questions immediately. Let's auto-generate a practice set based on the top recommendation.
        const topTopic = path.recommendedTopics[0];
        const topicName = topTopic?.topic || 'General';

        // Fetch questions for this topic
        // We'll use a new service method or repurpose generateAdaptiveQuestionSet if we can pass a topic filter
        // For now, let's fetch questions via repo in service or add a helper.
        // Since we are in controller, let's ask service to "getQuestionsForTopic(topic)"

        const questions = await this.adaptiveService.getQuestionsForTopic(topicName, 10);

        return {
            userId,
            rationale: topTopic?.reason || "General improvement based on initial assessment.",
            totalQuestions: questions.length,
            questions: questions.map(q => ({
                id: q.id,
                content: q.content,
                subject: q.subject?.title || 'General',
                chapter: q.topic || 'General',
                difficulty: q.difficultyWeight || 0.5
            }))
        };
    }
}

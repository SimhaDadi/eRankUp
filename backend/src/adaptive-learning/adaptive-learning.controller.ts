import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdaptiveLearningService } from './adaptive-learning.service';
import { TestSessionService } from '../test-session/test-session.service';

@Controller('adaptive')
@UseGuards(AuthGuard('jwt'))
export class AdaptiveLearningController {
    constructor(
        private readonly adaptiveService: AdaptiveLearningService,
        private readonly testSessionService: TestSessionService,
    ) { }

    @Post('start-session')
    async startSession(@Request() req: any, @Body() body: { questionIds?: string[], topic?: string, limit?: number }) {
        const userId = req.user.userId;
        let questions: any[] = [];

        if (body.topic) {
            questions = await this.adaptiveService.getQuestionsForTopic(body.topic, body.limit || 20);
        } else if (body.questionIds && body.questionIds.length > 0) {
            questions = await this.adaptiveService.getQuestionsByIds(body.questionIds);
        } else {
            // 2. Otherwise, generate purely based on AI recommendation (Fallback)
            console.log(`[Adaptive] No IDs provided. Generating from path...`);
            const path = await this.adaptiveService.generateLearningPath(userId);
            const topTopic = path.recommendedTopics[0]?.topic || 'General';
            questions = await this.adaptiveService.getQuestionsForTopic(topTopic, 20);
        }

        if (questions.length === 0) {
            console.warn(`[Adaptive] Questions empty after primary fetch. Trying fallback...`);
            // Final fallback if IDs were invalid or topic empty
            const path = await this.adaptiveService.generateLearningPath(userId);
            const topTopic = path.recommendedTopics[0]?.topic || 'General';
            questions = await this.adaptiveService.getQuestionsForTopic(topTopic, 20);
            console.log(`[Adaptive] Fallback fetched ${questions.length} questions.`);
        }

        // 3. Create a session with these questions
        const session = await this.testSessionService.createAdaptiveSession(userId, questions);

        return {
            sessionId: session.testId,
            questions: session.questions
        };
    }

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

        // Get user's mastery for these topics to check status
        const mastery = await this.adaptiveService.getWeakAreas(userId, 20);
        const today = new Date().setHours(0, 0, 0, 0);

        const tasks = path.recommendedTopics.map(rec => {
            const topicMastery = mastery.find(m => m.topic === rec.topic);
            const practicedToday = topicMastery?.lastPracticedAt
                ? new Date(topicMastery.lastPracticedAt).setHours(0, 0, 0, 0) === today
                : false;

            return {
                ...rec,
                isCompleted: practicedToday,
                masteryScore: topicMastery?.masteryScore || 0,
                advice: topicMastery?.cognitiveAdvice || "Practice this topic to improve your overall score."
            };
        });

        // Current questions for the top task
        const topTopic = path.recommendedTopics[0]?.topic || 'General';
        const questions = await this.adaptiveService.getQuestionsForTopic(topTopic, 10);

        return {
            userId,
            rationale: path.recommendedTopics[0]?.reason || "Personalized plan based on your recent performance.",
            tasks,
            questions: questions.map(q => ({
                id: q.id,
                content: q.content,
                subject: q.subject?.title || 'General',
                chapter: q.topic || 'General',
            })),
            stats: {
                totalTasks: tasks.length,
                completedToday: tasks.filter(t => t.isCompleted).length,
                overallMastery: mastery.length > 0
                    ? Math.round((mastery.reduce((acc, current) => acc + current.masteryScore, 0) / mastery.length) * 100)
                    : 0
            }
        };
    }
}

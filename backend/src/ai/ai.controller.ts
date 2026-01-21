import { Controller, Get, Post, Put, Query, Param, Body, UseGuards, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { AIService } from './ai.service';
import { ExplanationService } from './explanation.service';
// import { GenerateExplanationDto } from './dto/generate-explanation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { MigrationService } from './migration.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
    constructor(
        private readonly aiService: AIService,
        private readonly migrationService: MigrationService, // Keep this if migration service is still used elsewhere
        private readonly explanationService: ExplanationService
    ) { }

    @Post('parse-document')
    @UseInterceptors(FileInterceptor('file'))
    async parseDocument(@UploadedFile() file: any) {
        return this.aiService.parseDocument(file);
    }

    /**
     * GET /ai/recommend-questions
     * Smart question recommendation for a user
     * Query params: userId, count, subjectId (optional), chapterId (optional)
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('recommend-questions')
    async recommendQuestions(
        @Query('userId') userId: string,
        @Query('count') count?: string,
        @Query('subjectId') subjectId?: string,
        @Query('chapterId') chapterId?: string,
    ) {
        const questionCount = count ? parseInt(count) : 20;
        const questions = await this.aiService.recommendQuestions(
            userId,
            questionCount,
            subjectId,
            chapterId
        );

        return {
            count: questions.length,
            questions: questions.map(q => ({
                id: q.id,
                content: q.content,
                subject: q.subject?.title,
                chapter: q.chapter?.title,
                difficulty: q.difficultyWeight,
                positiveMarks: q.positiveMarks,
                negativeMarks: q.negativeMarks
            }))
        };
    }

    /**
     * POST /ai/calibrate-difficulty
     * Admin endpoint to recalibrate question difficulty based on performance data
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('calibrate-difficulty')
    async calibrateDifficulty() {
        const result = await this.aiService.calibrateDifficulty();
        return {
            message: `Successfully recalibrated ${result.updated} questions`,
            updated: result.updated,
            report: result.report.slice(0, 20) // Return top 20 changes
        };
    }

    /**
     * GET /ai/mastery-report/:userId
     * Get comprehensive mastery analysis for a user
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('mastery-report/:userId')
    async getMasteryReport(@Param('userId') userId: string) {
        const report = await this.aiService.getMasteryReport(userId);

        // Calculate overall statistics
        const totalAttempts = report.reduce((sum, r) => sum + r.totalAttempts, 0);
        const totalCorrect = report.reduce((sum, r) => sum + r.correctAttempts, 0);
        const overallMastery = totalAttempts > 0
            ? Math.round((totalCorrect / totalAttempts) * 100)
            : 0;

        return {
            userId,
            overallMastery,
            totalAttempts,
            totalCorrect,
            chapterBreakdown: report,
            weakestAreas: report.slice(0, 3),
            strongestAreas: report.slice(-3).reverse()
        };
    }

    /**
     * GET /ai/learning-path/:userId
     * Generate personalized learning path
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('learning-path/:userId')
    async generateLearningPath(
        @Param('userId') userId: string,
        @Query('count') count?: string
    ) {
        const targetQuestions = count ? parseInt(count) : 50;
        const result = await this.aiService.generateLearningPath(userId, targetQuestions);

        return {
            userId,
            rationale: result.rationale,
            totalQuestions: result.path.length,
            questions: result.path.map(q => ({
                id: q.id,
                content: q.content,
                subject: q.subject?.title,
                chapter: q.chapter?.title,
                difficulty: q.difficultyWeight
            }))
        };
    }

    /**
     * POST /ai/start-adaptive-session
     * Initializes a dynamic test session based on AI recommendations
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('start-adaptive-session')
    async startAdaptiveSession(@Request() req: any) {
        const userId = req.user.userId;
        const result = await this.aiService.generateLearningPath(userId, 20); // Default 20 for quick practice

        // Return the full session data including questions
        return {
            sessionId: `adaptive-${userId}`,
            questions: result.path,
            rationale: result.rationale
        };
    }

    /**
     * GET /ai/difficulty-distribution
     * Get difficulty distribution across the question bank
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('difficulty-distribution')
    async getDifficultyDistribution() {
        // This would be implemented in the service
        return {
            message: 'Difficulty distribution analysis',
            // Placeholder for now
            distribution: {
                easy: 0,
                medium: 0,
                hard: 0
            }
        };
    }

    /**
     * POST /ai/migrate-responses
     * Admin endpoint to migrate legacy userAnswers to Response entities
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('migrate-responses')
    async migrateResponses() {
        const result = await this.migrationService.migrateUserAnswersToResponses();
        return {
            message: 'Migration completed',
            migrated: result.migrated,
            skipped: result.skipped,
            total: result.migrated + result.skipped
        };
    }

    /**
     * POST /ai/explanation/:questionId
     * Generate AI explanation for a question
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('explanation/:questionId')
    async generateExplanation(
        @Param('questionId') questionId: string,
        @Body('userAnswer') userAnswer?: string
    ) {
        const explanation = await this.explanationService.generateExplanation(
            questionId,
            userAnswer
        );

        return {
            questionId,
            explanation,
            generatedAt: new Date()
        };
    }

    /**
     * POST /ai/explanations/bulk
     * Generate explanations for multiple questions (admin only)
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('explanations/bulk')
    async generateBulkExplanations(
        @Body('questionIds') questionIds: string[]
    ) {
        const explanations = await this.explanationService.generateBulkExplanations(questionIds);

        return {
            total: questionIds.length,
            generated: explanations.size,
            explanations: Object.fromEntries(explanations)
        };
    }

    /**
     * GET /ai/explanations
     * List all AI explanations with filtering (admin only)
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('explanations')
    async listExplanations(
        @Query('verified') verified?: string,
        @Query('minRating') minRating?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string
    ) {
        return await this.explanationService.listExplanations({
            verified: verified === 'true',
            minRating: minRating ? parseFloat(minRating) : undefined,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });
    }

    /**
     * GET /ai/explanations/unverified
     * List unverified explanations (admin only)
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('explanations/unverified')
    async listUnverifiedExplanations() {
        return await this.explanationService.listUnverifiedExplanations();
    }

    /**
     * POST /ai/explanations/:id/approve
     * Approve an AI explanation (admin only)
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('explanations/:id/approve')
    async approveExplanation(
        @Param('id') id: string,
        @Body('editedText') editedText?: string
    ) {
        return await this.explanationService.approveExplanation(id, editedText);
    }

    /**
     * POST /ai/explanations/:id/reject
     * Reject an AI explanation (admin only)
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('explanations/:id/reject')
    async rejectExplanation(
        @Param('id') id: string,
        @Body('reason') reason: string
    ) {
        return await this.explanationService.rejectExplanation(id, reason);
    }

    /**
     * PUT /ai/explanations/:id
     * Edit an AI explanation (admin only)
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put('explanations/:id')
    async updateExplanation(
        @Param('id') id: string,
        @Body('text') text: string
    ) {
        return await this.explanationService.updateExplanation(id, text);
    }

    /**
     * POST /ai/explanations/:questionId/feedback
     * Submit feedback for an explanation
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('explanations/:questionId/feedback')
    async submitFeedback(
        @Param('questionId') questionId: string,
        @Body('helpful') helpful: boolean,
        @Body('comment') comment?: string
    ) {
        return await this.explanationService.submitFeedback(questionId, helpful, comment);
    }

    /**
     * GET /ai/explanations/stats
     * Get AI explanation statistics (admin only)
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('explanations/stats')
    async getExplanationStats() {
        return await this.explanationService.getExplanationStats();
    }
}

import { Controller, Post, Get, Param, Body, UseGuards, HttpException, HttpStatus, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AIService } from './ai.service';
import { ExplanationService } from './explanation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../exams/entities/question.entity';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AIController {
    constructor(
        private aiService: AIService,
        private explanationService: ExplanationService,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
    ) { }

    @Post('parse-questions')
    async parseQuestions(@Body('text') text: string) {
        const questions = await this.aiService.parseQuestionsFromText(text);
        return { questions };
    }

    /**
     * Generate explanation for a single question
     * DEPRECATED: Use /explanations/generate/:questionId instead
     * Kept for backward compatibility
     */
    @Post('generate-explanation/:questionId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async generateExplanation(@Request() req: any, @Param('questionId') questionId: string) {
        try {
            // Delegate to ExplanationService (superior implementation)
            const explanation = await this.explanationService.generateExplanation(req.user.userId, req.user.role, questionId);

            return {
                success: true,
                explanation,
                questionId
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to generate explanation',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Batch generate explanations
     * DEPRECATED: Use /explanations/bulk-generate instead
     * Kept for backward compatibility
     */
    @Post('batch-generate-explanations')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async batchGenerateExplanations(
        @Request() req: any,
        @Body() body: { examId?: string; subjectId?: string; chapterId?: string; limit?: number }
    ) {
        try {
            const { examId, subjectId, chapterId, limit } = body;

            const queryBuilder = this.questionRepository.createQueryBuilder('question');

            if (examId) {
                queryBuilder.innerJoin('question.exams', 'exams', 'exams.id = :examId', { examId });
            }
            if (subjectId) queryBuilder.leftJoin('question.subject', 'subject').andWhere('subject.id = :subjectId', { subjectId });
            if (chapterId) queryBuilder.leftJoin('question.chapter', 'chapter').andWhere('chapter.id = :chapterId', { chapterId });

            queryBuilder.andWhere('(question.explanation IS NULL OR question.explanation = \'\')');
            if (limit) queryBuilder.take(limit);

            const questions = await queryBuilder.getMany();

            if (questions.length === 0) {
                return { success: true, message: 'No questions found without explanations', generated: 0, failed: 0 };
            }

            // Delegate to ExplanationService for bulk generation
            const questionIds = questions.map(q => q.id);
            const explanations = await this.explanationService.generateBulkExplanations(req.user.userId, req.user.role, questionIds);

            return {
                success: true,
                message: `Generated ${explanations.size} explanations`,
                generated: explanations.size,
                failed: questionIds.length - explanations.size,
                errors: []
            };
        } catch (error) {
            throw new HttpException(error.message || 'Failed to batch generate explanations', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get explanation for a question
     * DEPRECATED: Use /explanations/:questionId instead
     * Kept for backward compatibility
     */
    @Get('explanation/:questionId')
    async getExplanation(@Request() req: any, @Param('questionId') questionId: string) {
        try {
            // Delegate to ExplanationService
            const explanation = await this.explanationService.generateExplanation(req.user.userId, req.user.role, questionId);

            return {
                questionId,
                explanation: explanation || 'No explanation available yet.'
            };
        } catch (error) {
            throw new HttpException(error.message || 'Failed to fetch explanation', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

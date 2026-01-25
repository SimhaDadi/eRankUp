import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    HttpException,
    HttpStatus,
    Request
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ExplanationService } from './explanation.service';

@Controller('explanations')
@UseGuards(AuthGuard('jwt'))
export class ExplanationController {
    constructor(private explanationService: ExplanationService) { }

    /**
     * Generate explanation for a single question
     * Admin only - generates and caches AI explanation
     */
    @Post('generate/:questionId')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async generateExplanation(
        @Request() req: any,
        @Param('questionId') questionId: string,
        @Body('userAnswer') userAnswer?: string,
        @Body('examId') examId?: string
    ) {
        try {
            // Check if AI service is initialized
            if (!this.explanationService['isInitialized']) {
                throw new HttpException(
                    'AI service not configured. Please set GEMINI_API_KEY environment variable. Get your free API key at: https://makersuite.google.com/app/apikey',
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }

            const explanation = await this.explanationService.generateExplanation(
                req.user.userId,
                req.user.role,
                questionId,
                userAnswer,
                examId
            );

            return {
                success: true,
                questionId,
                explanation
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to generate explanation',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Generate missing explanations for questions
     * Admin only - backfill utility
     */
    @Post('generate-missing')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async generateMissingExplanations(
        @Request() req: any,
        @Body('limit') limit?: number
    ) {
        try {
            // Check if AI service is initialized
            if (!this.explanationService['isInitialized']) {
                throw new HttpException(
                    'AI service not configured. Please set GEMINI_API_KEY environment variable. Get your free API key at: https://makersuite.google.com/app/apikey',
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }

            const count = await this.explanationService.generateMissingExplanations(
                req.user.userId,
                req.user.role,
                limit
            );

            return {
                success: true,
                message: `Triggered generation for ${count} missing explanations`,
                count
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to generate missing explanations',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Batch generate explanations for multiple questions
     * Admin only - processes questions without explanations
     */
    @Post('bulk-generate')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async bulkGenerateExplanations(
        @Request() req: any,
        @Body() body: {
            questionIds?: string[];
            examId?: string;
            subjectId?: string;
            chapterId?: string;
            limit?: number;
        }
    ) {
        try {
            // Check if AI service is initialized
            if (!this.explanationService['isInitialized']) {
                throw new HttpException(
                    'AI service not configured. Please set GEMINI_API_KEY environment variable. Get your free API key at: https://makersuite.google.com/app/apikey',
                    HttpStatus.SERVICE_UNAVAILABLE
                );
            }

            const questionIds = body.questionIds || [];

            // If no specific IDs provided, find questions without explanations
            if (questionIds.length === 0) {
                // Use the missing generator but keep the bulk-generate interface for specific IDs
                const count = await this.explanationService.generateMissingExplanations(
                    req.user.userId,
                    req.user.role,
                    body.limit
                );
                return {
                    success: true,
                    message: `Triggered generation for ${count} missing explanations available via bulk`,
                    generated: count,
                    questionIds: []
                };
            }

            const explanations = await this.explanationService.generateBulkExplanations(
                req.user.userId,
                req.user.role,
                questionIds
            );

            return {
                success: true,
                generated: explanations.size,
                questionIds: Array.from(explanations.keys())
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to bulk generate explanations',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    /**
     * Get explanation for a question
     * Public - returns cached explanation if available
     */
    @Get(':questionId')
    async getExplanation(
        @Request() req: any,
        @Param('questionId') questionId: string,
        @Query('examId') examId?: string
    ) {
        try {
            const explanation = await this.explanationService.generateExplanation(
                req.user.userId,
                req.user.role,
                questionId,
                undefined,
                examId
            );

            return {
                questionId,
                explanation
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch explanation',
                HttpStatus.NOT_FOUND
            );
        }
    }

    /**
     * List all explanations with filters
     * Admin only
     */
    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async listExplanations(
        @Query('verified') verified?: string,
        @Query('minRating') minRating?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string
    ) {
        try {
            const filters = {
                verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
                minRating: minRating ? parseFloat(minRating) : undefined,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0
            };

            return await this.explanationService.listExplanations(filters);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to list explanations',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get unverified explanations for admin review
     * Admin only
     */
    @Get('admin/unverified')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getUnverifiedExplanations() {
        try {
            return await this.explanationService.listUnverifiedExplanations();
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch unverified explanations',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Approve an explanation (with optional edits)
     * Admin only
     */
    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async approveExplanation(
        @Param('id') id: string,
        @Body('editedText') editedText?: string
    ) {
        try {
            return await this.explanationService.approveExplanation(id, editedText);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to approve explanation',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Reject an explanation
     * Admin only
     */
    @Delete(':id/reject')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async rejectExplanation(
        @Param('id') id: string,
        @Body('reason') reason: string
    ) {
        try {
            return await this.explanationService.rejectExplanation(id, reason);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to reject explanation',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Update an explanation
     * Admin only
     */
    @Put(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateExplanation(
        @Param('id') id: string,
        @Body('text') text: string
    ) {
        try {
            return await this.explanationService.updateExplanation(id, text);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update explanation',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Submit user feedback on an explanation
     * Public
     */
    @Post(':questionId/feedback')
    async submitFeedback(
        @Param('questionId') questionId: string,
        @Body() body: { helpful: boolean; comment?: string }
    ) {
        try {
            return await this.explanationService.submitFeedback(
                questionId,
                body.helpful,
                body.comment
            );
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to submit feedback',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get explanation statistics
     * Admin only
     */
    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getStats() {
        try {
            return await this.explanationService.getExplanationStats();
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to fetch stats',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}

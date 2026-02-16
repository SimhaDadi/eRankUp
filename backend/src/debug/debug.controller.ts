import { Controller, Get, Param } from '@nestjs/common';
import { ExplanationService } from '../ai/explanation.service';
import { UserRole } from '../users/user.entity';

/**
 * Diagnostic controller for testing explanation generation
 * Temporary controller to help debug AI generation issues
 */
@Controller('debug')
export class DebugController {
    constructor(private explanationService: ExplanationService) { }

    /**
     * Test explanation generation and return detailed error info
     * Usage: GET /debug/test-explanation/:questionId
     */
    @Get('test-explanation/:questionId')
    async testExplanationGeneration(@Param('questionId') questionId: string) {
        try {
            console.log('🧪 DEBUG: Starting explanation generation test...');

            const explanation = await this.explanationService.generateExplanation(
                'debug-user',
                UserRole.ADMIN,
                questionId,
                undefined,
                undefined
            );

            const length = typeof explanation === 'string'
                ? explanation.length
                : (explanation.adminApprovedExplanation?.length || explanation.aiExplanation?.length || 0);

            return {
                success: true,
                message: 'Explanation generated successfully',
                explanation,
                length
            };
        } catch (error) {
            // Return detailed error information
            return {
                success: false,
                error: {
                    type: error.constructor.name,
                    message: error.message,
                    status: error.status,
                    response: error.response?.data,
                    stack: error.stack?.split('\n').slice(0, 10).join('\n')
                }
            };
        }
    }
}

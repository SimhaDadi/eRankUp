import { Controller, Get, UseGuards, Query, Param, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PercentileService } from './percentile.service';
import { PatternDetectionService } from './pattern-detection.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('analytics')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly percentileService: PercentileService,
        private readonly patternDetectionService: PatternDetectionService,
    ) { }

    @Get('overview')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getOverview() {
        return this.analyticsService.getOverviewStats();
    }

    @Get('students')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getStudentList(@Query('page') page: number, @Query('limit') limit: number, @Query('search') search: string) {
        return this.analyticsService.getStudentList(page, limit, search);
    }

    @Get('users')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getUserAnalytics() {
        return this.analyticsService.getUserAnalytics();
    }

    @Get('exams')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getExamAnalytics() {
        return this.analyticsService.getExamAnalytics();
    }

    @Get('revenue')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getRevenueAnalytics() {
        return this.analyticsService.getRevenueAnalytics();
    }

    @Get('attempt/:id')
    @UseGuards(AuthGuard('jwt'))
    async getAttemptAnalysis(@Param('id') id: string, @Request() req: any) {
        return this.analyticsService.getAttemptAnalysis(id, req.user.userId);
    }

    /**
     * Get percentile ranking for an exam
     */
    @Get('percentile/exam/:examId')
    @UseGuards(AuthGuard('jwt'))
    async getExamPercentile(@Param('examId') examId: string, @Request() req: any) {
        try {
            return await this.percentileService.calculatePercentile(req.user.userId, examId);
        } catch (error) {
            throw new HttpException(error.message || 'Failed to calculate percentile', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get percentile ranking by attempt ID (recommended for results page)
     * This automatically determines the correct exam/model for comparison
     */
    @Get('percentile/attempt/:attemptId')
    @UseGuards(AuthGuard('jwt'))
    async getAttemptPercentile(@Param('attemptId') attemptId: string, @Request() req: any) {
        try {
            const result = await this.percentileService.calculatePercentileByAttempt(
                attemptId,
                req.user.userId
            );
            return result;
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to calculate percentile',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Get percentile ranking for a test/model
     */
    @Get('percentile/model/:modelId')
    @UseGuards(AuthGuard('jwt'))
    async getModelPercentile(@Param('modelId') modelId: string, @Request() req: any) {
        try {
            return await this.percentileService.calculateModelPercentile(req.user.userId, modelId);
        } catch (error) {
            throw new HttpException(error.message || 'Failed to calculate percentile', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get weakness patterns for current user
     */
    @Get('patterns')
    @UseGuards(AuthGuard('jwt'))
    async getPatterns(@Request() req: any) {
        try {
            const patterns = await this.patternDetectionService.detectPatterns(req.user.userId);
            return {
                patterns,
                totalPatterns: patterns.length,
                highSeverityCount: patterns.filter(p => p.severity === 'high').length
            };
        } catch (error) {
            throw new HttpException(error.message || 'Failed to detect patterns', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get patterns for a specific user (admin only)
     */
    @Get('patterns/:userId')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getUserPatterns(@Param('userId') userId: string) {
        try {
            const patterns = await this.patternDetectionService.detectPatterns(userId);
            return { userId, patterns, totalPatterns: patterns.length };
        } catch (error) {
            throw new HttpException(error.message || 'Failed to detect patterns', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

import { Controller, Get, UseGuards, Query, Param, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('overview')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async getOverview() {
        return this.analyticsService.getOverviewStats();
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
}

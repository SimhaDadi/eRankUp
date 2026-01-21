import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { SystemHealthService } from './system-health.service';

@Controller('admin/system')
export class SystemHealthController {
    constructor(
        private readonly systemHealthService: SystemHealthService
    ) { }

    /**
     * GET /admin/system/health
     * Get overall system health status
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('health')
    async getSystemHealth() {
        return await this.systemHealthService.getSystemHealth();
    }

    /**
     * GET /admin/system/api-usage
     * Get API usage statistics
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('api-usage')
    getAPIUsage() {
        return this.systemHealthService.getAPIUsage();
    }

    /**
     * GET /admin/system/cache-stats
     * Get cache statistics
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('cache-stats')
    async getCacheStats() {
        return await this.systemHealthService.getCacheStats();
    }

    /**
     * GET /admin/system/errors
     * Get recent error logs
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('errors')
    async getRecentErrors() {
        return await this.systemHealthService.getRecentErrors();
    }

    /**
     * GET /admin/system/metrics
     * Get system performance metrics
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('metrics')
    async getSystemMetrics() {
        return await this.systemHealthService.getSystemMetrics();
    }
}

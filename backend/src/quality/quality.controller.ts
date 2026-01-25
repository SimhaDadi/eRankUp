import { Controller, Get, Put, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { QualityService } from './quality.service';

@Controller('quality/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class QualityController {
    constructor(private readonly qualityService: QualityService) { }

    /**
     * GET /quality/admin/flags
     * Get all quality flags with filtering
     */
    @Get('flags')
    async getFlags(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string,
        @Query('type') type?: string,
    ) {
        return this.qualityService.getFlags(page, limit, status, type);
    }

    /**
     * GET /quality/admin/stats
     * Get quality control statistics
     */
    @Get('stats')
    async getStats() {
        return this.qualityService.getStats();
    }

    /**
     * PUT /quality/admin/flag/:id
     * Update flag status and add admin notes
     */
    @Put('flag/:id')
    async updateFlag(
        @Param('id') id: string,
        @Body() body: {
            status: string;
            adminNotes?: string;
        },
        @Request() req
    ) {
        return this.qualityService.updateFlag(id, body.status, body.adminNotes, req.user.userId);
    }
}

import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { LiveExamsService } from './live-exams.service';

@Controller('admin/live-exams')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class LiveExamsController {
    constructor(private readonly liveExamsService: LiveExamsService) { }

    /**
     * PUT /admin/live-exams/:id
     * Toggle live exam status
     */
    @Put(':id')
    async toggleLiveStatus(
        @Param('id') examId: string,
        @Body() body: {
            isLive: boolean;
            startTime?: Date;
            endTime?: Date;
        }
    ) {
        return this.liveExamsService.toggleLiveStatus(examId, body);
    }
}

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin/notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('templates')
    async getTemplates() {
        return this.notificationsService.getAllTemplates();
    }

    @Post('templates')
    async createTemplate(@Body() body: any) {
        return this.notificationsService.createTemplate(body);
    }

    @Put('templates/:id')
    async updateTemplate(@Param('id') id: string, @Body() body: any) {
        return this.notificationsService.updateTemplate(id, body);
    }

    @Delete('templates/:id')
    async deleteTemplate(@Param('id') id: string) {
        return this.notificationsService.deleteTemplate(id);
    }

    @Post('send')
    async sendNotification(@Body() body: { title: string; body: string; recipients: string[] | 'ALL' }) {
        return this.notificationsService.sendBulkNotification(body);
    }

    @Get('my')
    @UseGuards(AuthGuard('jwt'))
    async getMyNotifications(@Request() req) {
        return this.notificationsService.getUserNotifications(req.user.userId);
    }

    @Put(':id/read')
    @UseGuards(AuthGuard('jwt'))
    async markRead(@Param('id') id: string, @Request() req) {
        return this.notificationsService.markAsRead(id, req.user.userId);
    }
}

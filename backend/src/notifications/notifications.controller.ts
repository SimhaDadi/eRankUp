import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('templates')
    @Roles(UserRole.ADMIN)
    async getTemplates() {
        return this.notificationsService.getAllTemplates();
    }

    @Post('templates')
    @Roles(UserRole.ADMIN)
    async createTemplate(@Body() body: any) {
        return this.notificationsService.createTemplate(body);
    }

    @Delete('templates/:id')
    @Roles(UserRole.ADMIN)
    async deleteTemplate(@Param('id') id: string) {
        return this.notificationsService.deleteTemplate(id);
    }

    @Post('send')
    @Roles(UserRole.ADMIN)
    async sendNotification(@Body() body: { title: string; message: string; targetUsers: 'all' | 'active' | 'inactive'; userIds?: string[] }) {
        return this.notificationsService.sendAdminNotification(body);
    }

    @Get('my')
    async getMyNotifications(@Request() req) {
        return this.notificationsService.getUserNotifications(req.user.userId);
    }

    @Put(':id/read')
    @UseGuards(AuthGuard('jwt'))
    async markRead(@Param('id') id: string, @Request() req) {
        return this.notificationsService.markAsRead(id, req.user.userId);
    }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Notification } from './entities/notification.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationTemplate)
        private templateRepository: Repository<NotificationTemplate>,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async createTemplate(data: { name: string; title: string; body: string; type: 'general' | 'promotion' | 'alert' }) {
        const template = this.templateRepository.create(data);
        return this.templateRepository.save(template);
    }

    async getAllTemplates() {
        return this.templateRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async updateTemplate(id: string, data: Partial<NotificationTemplate>) {
        await this.templateRepository.update(id, data);
        return this.templateRepository.findOne({ where: { id } });
    }

    async deleteTemplate(id: string) {
        return this.templateRepository.delete(id);
    }

    async getUserNotifications(userId: string) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.notificationRepository.update({ id, userId }, { isRead: true });
    }

    async sendBulkNotification(data: { title: string; body: string; recipients: string[] | 'ALL' }) {
        let usersToNotify: User[] = [];

        if (data.recipients === 'ALL') {
            usersToNotify = await this.userRepository.find({ select: ['id'] });
        } else {
            // parsing recipients string[] to user ids if needed, assuming validation done elsewhere
            // For now simplest assumption: recipients is array of userIds
            // In real app, might be email list etc. adapting to IDs:
            usersToNotify = await this.userRepository.findByIds(data.recipients);
        }

        // Batch insert for performance
        const notifications = usersToNotify.map(user => ({
            userId: user.id,
            title: data.title,
            body: data.body,
            type: 'general', // Default type
            isRead: false
        }));

        // Chunking inserts to avoid query size limits
        const chunkSize = 500;
        for (let i = 0; i < notifications.length; i += chunkSize) {
            await this.notificationRepository.save(notifications.slice(i, i + chunkSize));
        }

        console.log(`Stored ${notifications.length} notifications in DB.`);

        return {
            success: true,
            message: `Notification sent to ${notifications.length} users`,
            timestamp: new Date()
        };
    }
}

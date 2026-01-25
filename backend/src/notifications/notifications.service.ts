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

    /**
     * Send admin notification with targeted filtering
     * Supports: 'all', 'active', 'inactive', or specific userIds
     */
    async sendAdminNotification(data: { title: string; message: string; targetUsers: 'all' | 'active' | 'inactive'; userIds?: string[] }) {
        let usersToNotify: User[] = [];

        if (data.userIds && data.userIds.length > 0) {
            usersToNotify = await this.userRepository.findByIds(data.userIds);
        } else {
            const queryBuilder = this.userRepository.createQueryBuilder('user');

            if (data.targetUsers === 'active') {
                // Active users: logged in within last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                queryBuilder.where('user.lastLoginAt >= :date', { date: thirtyDaysAgo });
            } else if (data.targetUsers === 'inactive') {
                // Inactive users: not logged in for 30+ days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                queryBuilder.where('user.lastLoginAt < :date OR user.lastLoginAt IS NULL', { date: thirtyDaysAgo });
            }
            // 'all' - no filter needed

            usersToNotify = await queryBuilder.getMany();
        }

        if (usersToNotify.length === 0) {
            return {
                success: true,
                message: 'No users matched the criteria',
                recipientCount: 0
            };
        }

        // Batch insert for performance
        // Map 'message' (frontend param) to 'body' (db column)
        const notifications = usersToNotify.map(user => ({
            userId: user.id,
            title: data.title,
            body: data.message,
            type: 'general',
            isRead: false
        }));

        // Chunking
        const chunkSize = 500;
        for (let i = 0; i < notifications.length; i += chunkSize) {
            await this.notificationRepository.save(notifications.slice(i, i + chunkSize));
        }

        return {
            success: true,
            message: `Notification sent to ${notifications.length} users`,
            recipientCount: notifications.length,
            timestamp: new Date()
        };
    }

    async createTemplate(data: any) {
        // Ensure data maps correctly to entity
        // Frontend sends: { title, message, category }
        // Entity expects: { title, body, type, name (required column) }

        const templateData = {
            name: data.title, // Use title as name if not provided
            title: data.title,
            body: data.message || data.body,
            type: data.category || 'general'
        };

        const template = this.templateRepository.create(templateData);
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
}

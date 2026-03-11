import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Notification } from './entities/notification.entity';
import { User } from '../users/user.entity';

import { FirebaseService } from './firebase.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationTemplate, Notification, User]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, FirebaseService],
    exports: [NotificationsService, FirebaseService],
})
export class NotificationsModule { }

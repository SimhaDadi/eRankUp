import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationTemplate } from './entities/notification-template.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationTemplate]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
})
export class NotificationsModule { }

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ExamsModule } from './exams/exams.module';
import { TestSessionModule } from './test-session/test-session.module';
import { PaymentsModule } from './payments/payments.module';
import { ChatModule } from './chat/chat.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AIModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { GamificationModule } from './gamification/gamification.module';
import { AdaptiveLearningModule } from './adaptive-learning/adaptive-learning.module';
import { AIChatModule } from './ai-chat/ai-chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PassesModule } from './passes/passes.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', 'backend/.env', '../.env'],
        }),
        ScheduleModule.forRoot(),
        CommonModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get<string>('DB_USER', 'admin'),
                password: config.get<string>('DB_PASSWORD', 'password'),
                database: config.get<string>('DB_NAME', 'erankup_db'),
                // entities: [__dirname + '/**/*.entity{.ts,.js}'],
                autoLoadEntities: true,
                synchronize: true,
            }),
        }),
        AuthModule,
        UsersModule,
        ExamsModule,
        TestSessionModule,
        PaymentsModule,
        ChatModule,
        AnalyticsModule,
        AIModule,
        AdminModule,
        GamificationModule,
        AdaptiveLearningModule,
        AIChatModule,
        NotificationsModule,
        PassesModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }


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
import { QualityModule } from './quality/quality.module';
import { DoubtsModule } from './doubts/doubts.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CategoriesModule } from './categories/categories.module';
import { NewsModule } from './news/news.module';
import { CommunityModule } from './community/community.module';
import { AIStudyModule } from './ai-study/ai-study.module';
import { ContentModule } from './content/content.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', 'backend/.env', '../.env'],
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 120, // Increased for dev/testing
        }]),
        ScheduleModule.forRoot(),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
                index: false,
                fallthrough: true
            }
        }),
        CommonModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const dbConfig = {
                    type: 'postgres' as const,
                    host: config.get<string>('DB_HOST', 'localhost'),
                    port: config.get<number>('DB_PORT', 5432),
                    username: config.get<string>('DB_USER', 'admin'),
                    password: config.get<string>('DB_PASSWORD', 'password'),
                    database: config.get<string>('DB_NAME', 'erankup_db'),
                    // entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    autoLoadEntities: true,
                    synchronize: config.get<string | boolean>('DB_SYNCHRONIZE') === true || config.get<string | boolean>('DB_SYNCHRONIZE') === 'true',
                    ssl: false,
                    extra: {
                        max: 20,
                        min: 5,
                        idleTimeoutMillis: 30000,
                        connectionTimeoutMillis: 2000,
                    },
                };
                console.log('DB Config:', { ...dbConfig, password: '***' });
                return dbConfig;
            },
        }),
        AuthModule,
        UsersModule,
        ExamsModule,
        AdminModule,
        TestSessionModule,
        PaymentsModule,
        ChatModule,
        AnalyticsModule,
        AIModule,
        GamificationModule,
        AdaptiveLearningModule,
        AIChatModule,
        NotificationsModule,
        PassesModule,
        QualityModule,
        DoubtsModule,
        CategoriesModule,
        NewsModule,
        CommunityModule,
        AIStudyModule,
        ContentModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }


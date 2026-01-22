import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PercentileService } from './percentile.service';
import { PatternDetectionService } from './pattern-detection.service';
import { User } from '../users/user.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Response } from '../exams/entities/response.entity';
import { Purchase } from '../exams/entities/purchase.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Exam, Attempt, Response, Purchase])
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, PercentileService, PatternDetectionService],
    exports: [AnalyticsService, PercentileService, PatternDetectionService]
})
export class AnalyticsModule { }

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LiveExamsController } from './live-exams.controller';
import { LiveExamsService } from './live-exams.service';
import { Purchase } from '../exams/entities/purchase.entity';
import { User } from '../users/user.entity';
import { Exam } from '../exams/entities/exam.entity';
import { UserPass } from '../passes/entities/user-pass.entity';
import { ExamsModule } from '../exams/exams.module';

import { SystemMetric } from './entities/system-metric.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase, User, Exam, UserPass, SystemMetric]),
        ConfigModule,
        forwardRef(() => ExamsModule)
    ],
    controllers: [
        SystemHealthController,
        FinanceController,
        MediaController,
        LiveExamsController
    ],
    providers: [
        SystemHealthService,
        FinanceService,
        MediaService,
        LiveExamsService
    ],
    exports: [
        SystemHealthService,
        FinanceService,
        MediaService,
        LiveExamsService
    ]
})
export class AdminModule { }


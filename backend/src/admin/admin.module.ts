import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Purchase } from '../exams/entities/purchase.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase]),
        ConfigModule
    ],
    controllers: [SystemHealthController, FinanceController, MediaController],
    providers: [SystemHealthService, FinanceService, MediaService],
    exports: [SystemHealthService, FinanceService, MediaService]
})
export class AdminModule { }

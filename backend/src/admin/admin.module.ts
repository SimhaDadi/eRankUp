import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Purchase } from '../exams/entities/purchase.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase]),
        ConfigModule
    ],
    controllers: [SystemHealthController, FinanceController],
    providers: [SystemHealthService, FinanceService],
    exports: [SystemHealthService, FinanceService]
})
export class AdminModule { }

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Purchase } from '../exams/entities/purchase.entity';
import { Exam } from '../exams/entities/exam.entity';
import { ExamsModule } from '../exams/exams.module';
import { MarketingModule } from '../marketing/marketing.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase, Exam]),
        forwardRef(() => ExamsModule),
        MarketingModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }

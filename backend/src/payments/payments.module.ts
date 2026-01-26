import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Purchase } from '../exams/entities/purchase.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Pass } from '../passes/entities/pass.entity';
import { UserPass } from '../passes/entities/user-pass.entity';
import { ExamsModule } from '../exams/exams.module';
import { MarketingModule } from '../marketing/marketing.module';
import { PassesModule } from '../passes/passes.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase, Exam, Pass, UserPass]),
        forwardRef(() => ExamsModule),
        MarketingModule,
        PassesModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }


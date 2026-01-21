import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { Exam } from './entities/exam.entity';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Model } from './entities/model.entity';
import { Question } from './entities/question.entity';
import { Attempt } from './entities/attempt.entity';
import { Response } from './entities/response.entity';
import { Purchase } from './entities/purchase.entity';
import { ExamsSeederService } from './exams-seeder.service';
import { ScorerService } from './scorer.service';
import { DifficultyService } from './difficulty.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Exam, Subject, Chapter, Model, Question, Attempt, Response, Purchase]),
        forwardRef(() => PaymentsModule),
    ],
    controllers: [ExamsController],
    providers: [ExamsService, ExamsSeederService, ScorerService, DifficultyService],
    exports: [ExamsService, ScorerService, DifficultyService]
})
export class ExamsModule { }

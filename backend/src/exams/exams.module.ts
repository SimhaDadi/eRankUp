import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { SubjectsController } from './subjects.controller';
import { ChaptersController } from './chapters.controller';
import { ModelsController } from './models.controller';
import { QuestionsController } from './questions.controller';
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
import { AIModule } from '../ai/ai.module';
import { QuestionsUploadService } from './services/questions-upload.service';
import { GamificationModule } from '../gamification/gamification.module';
import { AdaptiveLearningModule } from '../adaptive-learning/adaptive-learning.module';
import { TestSessionModule } from '../test-session/test-session.module';
import { PassesModule } from '../passes/passes.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Exam, Subject, Chapter, Model, Question, Attempt, Response, Purchase]),
        forwardRef(() => PaymentsModule),
        forwardRef(() => TestSessionModule),
        AIModule,
        GamificationModule,
        AdaptiveLearningModule,
        PassesModule,
    ],
    controllers: [ExamsController, SubjectsController, ChaptersController, ModelsController, QuestionsController],
    providers: [ExamsService, ExamsSeederService, ScorerService, DifficultyService, QuestionsUploadService],
    exports: [ExamsService, ScorerService, DifficultyService]
})
export class ExamsModule { }

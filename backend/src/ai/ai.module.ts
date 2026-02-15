import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { ExplanationController } from './explanation.controller';
import { MigrationService } from './migration.service';
import { ExplanationService } from './explanation.service';
import { AIQueueService } from './ai-queue.service';
import { Question } from '../exams/entities/question.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Response } from '../exams/entities/response.entity';
import { Subject } from '../exams/entities/subject.entity';
import { Chapter } from '../exams/entities/chapter.entity';
import { Model } from '../exams/entities/model.entity';
import { QuestionExplanation } from './entities/question-explanation.entity';
import { AIUsage } from './entities/ai-usage.entity';
import { AIUsageService } from './ai-usage.service';
import { Exam } from '../exams/entities/exam.entity';
import { AdminModule } from '../admin/admin.module';
import { PromptBuilderService } from './prompt-builder.service';
import { AIUtilsService } from './ai-utils.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Question, Attempt, Response, Subject, Chapter, Model, QuestionExplanation, Exam, AIUsage]),
        forwardRef(() => AdminModule),
        ConfigModule
    ],
    controllers: [AIController, ExplanationController],
    providers: [AIService, MigrationService, ExplanationService, AIQueueService, AIUsageService, PromptBuilderService, AIUtilsService],
    exports: [AIService, MigrationService, ExplanationService, AIQueueService, AIUsageService, PromptBuilderService, AIUtilsService]
})
export class AIModule { }

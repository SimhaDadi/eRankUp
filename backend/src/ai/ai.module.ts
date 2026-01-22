import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { ExplanationController } from './explanation.controller';
import { MigrationService } from './migration.service';
import { ExplanationService } from './explanation.service';
import { Question } from '../exams/entities/question.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Response } from '../exams/entities/response.entity';
import { Subject } from '../exams/entities/subject.entity';
import { Chapter } from '../exams/entities/chapter.entity';
import { QuestionExplanation } from './entities/question-explanation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Question, Attempt, Response, Subject, Chapter, QuestionExplanation])
    ],
    controllers: [AIController, ExplanationController],
    providers: [AIService, MigrationService, ExplanationService],
    exports: [AIService, MigrationService, ExplanationService]
})
export class AIModule { }

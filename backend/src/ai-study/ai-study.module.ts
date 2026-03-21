import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionService } from './revision.service';
import { AIStudyController } from './ai-study.controller';
import { Response } from '../exams/entities/response.entity';
import { Question } from '../exams/entities/question.entity';
import { Attempt } from '../exams/entities/attempt.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Response, Question, Attempt])],
    controllers: [AIStudyController],
    providers: [RevisionService],
    exports: [RevisionService],
})
export class AIStudyModule { }

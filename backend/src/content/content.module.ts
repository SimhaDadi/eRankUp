import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Question } from '../exams/entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { QuestionFlag } from './entities/question-flag.entity';
import { Media } from './entities/media.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Question, Exam, QuestionFlag, Media]),
    ],
    controllers: [ContentController, QualityController, MediaController],
    providers: [ContentService, QualityService, MediaService],
})
export class ContentModule { }

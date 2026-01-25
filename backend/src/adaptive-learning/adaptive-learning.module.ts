import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdaptiveLearningService } from './adaptive-learning.service';
import { AdaptiveLearningController } from './adaptive-learning.controller';
import { UserTopicMastery } from './entities/user-topic-mastery.entity';
import { LearningPath } from './entities/learning-path.entity';
import { Question } from '../exams/entities/question.entity';
import { Response } from '../exams/entities/response.entity';
import { TestSessionModule } from '../test-session/test-session.module';
import { AIModule } from '../ai/ai.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserTopicMastery,
            LearningPath,
            Question,
            Response,
        ]),
        TestSessionModule,
        AIModule,
    ],
    controllers: [AdaptiveLearningController],
    providers: [AdaptiveLearningService],
    exports: [AdaptiveLearningService],
})
export class AdaptiveLearningModule { }

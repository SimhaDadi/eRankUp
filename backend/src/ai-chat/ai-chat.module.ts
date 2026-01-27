import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIChatService } from './ai-chat.service';
import { AIChatController } from './ai-chat.controller';
import { AIChatGateway } from './ai-chat.gateway';
import { ChatConversation } from './entities/chat-conversation.entity';
import { AIChatMessage } from './entities/chat-message.entity';
import { StudentInsight } from './entities/student-insight.entity';
import { User } from '../users/user.entity';
import { Question } from '../exams/entities/question.entity';
import { Response } from '../exams/entities/response.entity';
import { UserTopicMastery } from '../adaptive-learning/entities/user-topic-mastery.entity';
import { AIModule } from '../ai/ai.module';
import { AdaptiveLearningModule } from '../adaptive-learning/adaptive-learning.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ChatConversation,
            AIChatMessage,
            StudentInsight,
            User,
            Question,
            Response,
            UserTopicMastery
        ]),
        AIModule,
        AdaptiveLearningModule,
    ],
    controllers: [AIChatController],
    providers: [AIChatService, AIChatGateway],
    exports: [AIChatService],
})
export class AIChatModule { }

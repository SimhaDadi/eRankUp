import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIChatService } from './ai-chat.service';
import { AIChatController } from './ai-chat.controller';
import { ChatConversation } from './entities/chat-conversation.entity';
import { AIChatMessage } from './entities/chat-message.entity';
import { AIModule } from '../ai/ai.module';
import { AdaptiveLearningModule } from '../adaptive-learning/adaptive-learning.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatConversation, AIChatMessage]),
        AIModule,
        AdaptiveLearningModule,
    ],
    controllers: [AIChatController],
    providers: [AIChatService],
    exports: [AIChatService],
})
export class AIChatModule { }

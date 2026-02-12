import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { ExplanationService } from '../ai/explanation.service';
import { AIService } from '../ai/ai.service';
import { PromptBuilderService } from '../ai/prompt-builder.service';
import { AIUsageService } from '../ai/ai-usage.service';
import { AIUtilsService } from '../ai/ai-utils.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionExplanation } from '../ai/entities/question-explanation.entity';
import { Question } from '../exams/entities/question.entity';
import { AIUsage } from '../ai/entities/ai-usage.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([QuestionExplanation, Question, AIUsage])
    ],
    controllers: [DebugController],
    providers: [ExplanationService, AIService, PromptBuilderService, AIUsageService, AIUtilsService]
})
export class DebugModule { }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { AIService } from '../ai/ai.service';
import { AdaptiveLearningService } from '../adaptive-learning/adaptive-learning.service';

export interface SendMessageResponse {
    response: string;
    conversationId: string;
}

@Injectable()
export class AIChatService {
    constructor(
        @InjectRepository(ChatConversation)
        private conversationRepo: Repository<ChatConversation>,
        @InjectRepository(ChatMessage)
        private messageRepo: Repository<ChatMessage>,
        private aiService: AIService,
        private adaptiveLearningService: AdaptiveLearningService,
    ) { }

    async sendMessage(
        userId: string,
        conversationId: string | null,
        message: string,
    ): Promise<SendMessageResponse> {
        // Get or create conversation
        let conversation: ChatConversation;

        if (conversationId) {
            conversation = await this.conversationRepo.findOne({
                where: { id: conversationId, userId }
            });
            if (!conversation) {
                throw new Error('Conversation not found');
            }
        } else {
            // Create new conversation with title from first message
            const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            conversation = this.conversationRepo.create({
                userId,
                title,
            });
            conversation = await this.conversationRepo.save(conversation);
        }

        // Get user context (weak areas, mastery scores)
        const weakAreas = await this.adaptiveLearningService.getWeakAreas(userId, 5);
        const context = {
            weakAreas: weakAreas.map(w => ({ topic: w.topic, mastery: w.masteryScore })),
            timestamp: new Date().toISOString(),
        };

        // Save user message
        const userMessage = this.messageRepo.create({
            conversationId: conversation.id,
            role: 'user',
            content: message,
            context,
        });
        await this.messageRepo.save(userMessage);

        // Get conversation history (last 10 messages for context)
        const history = await this.messageRepo.find({
            where: { conversationId: conversation.id },
            order: { createdAt: 'ASC' },
            take: 10,
        });

        // Build contextual prompt
        const prompt = this.buildContextualPrompt(message, context, history);

        // Get AI response with error handling
        let aiResponse: string;
        try {
            aiResponse = await this.aiService.generateText(prompt);
        } catch (error) {
            console.error('[AIChat] Gemini API error:', error);
            aiResponse = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If the problem persists, please contact support.";
        }

        // Save assistant message
        const assistantMessage = this.messageRepo.create({
            conversationId: conversation.id,
            role: 'assistant',
            content: aiResponse,
        });
        await this.messageRepo.save(assistantMessage);

        // Update conversation timestamp
        conversation.updatedAt = new Date();
        await this.conversationRepo.save(conversation);

        return {
            response: aiResponse,
            conversationId: conversation.id,
        };
    }

    private buildContextualPrompt(
        message: string,
        context: any,
        history: ChatMessage[],
    ): string {
        const weakAreasText = context.weakAreas.length > 0
            ? context.weakAreas.map(w => `${w.topic} (${Math.round(w.mastery * 100)}% mastery)`).join(', ')
            : 'No weak areas identified yet';

        const historyText = history
            .slice(-6) // Last 3 exchanges (6 messages)
            .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
            .join('\n');

        return `You are an expert AI tutor for competitive exam preparation in India (SSC, Banking, Railways, etc.).

Student's Current Weak Areas: ${weakAreasText}

Recent Conversation:
${historyText}

Student's New Question: ${message}

Instructions:
1. Provide clear, encouraging, and helpful responses
2. If they ask for practice questions, generate 3-5 multiple-choice questions with detailed explanations
3. If they ask for explanations, use simple language with real-world examples
4. If they mention a weak area, focus on that topic
5. Keep responses concise but comprehensive (max 300 words unless generating questions)
6. Use bullet points and formatting for clarity

Your Response:`;
    }

    async getConversations(userId: string): Promise<ChatConversation[]> {
        return this.conversationRepo.find({
            where: { userId },
            order: { updatedAt: 'DESC' },
            take: 20,
        });
    }

    async getConversationMessages(conversationId: string, userId: string): Promise<ChatMessage[]> {
        // Verify ownership
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId, userId },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        return this.messageRepo.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
        });
    }

    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId, userId },
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        await this.conversationRepo.remove(conversation);
    }
}

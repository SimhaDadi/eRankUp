import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from './entities/chat-conversation.entity';
import { AIChatMessage } from './entities/chat-message.entity';
import { StudentInsight } from './entities/student-insight.entity';
import { User } from '../users/user.entity';
import { Question } from '../exams/entities/question.entity';
import { Response } from '../exams/entities/response.entity';
import { UserTopicMastery } from '../adaptive-learning/entities/user-topic-mastery.entity';
import { AIService } from '../ai/ai.service';
import { AIUsageService } from '../ai/ai-usage.service';
import { AdaptiveLearningService } from '../adaptive-learning/adaptive-learning.service';
import { UserRole } from '../users/user.entity';
import { AIQueueService, AIPriority } from '../ai/ai-queue.service';
import { PromptBuilderService } from '../ai/prompt-builder.service';
import { AIUtilsService } from '../ai/ai-utils.service';

export interface SendMessageResponse {
    response: string;
    conversationId: string;
}

@Injectable()
export class AIChatService {
    private readonly logger = new Logger(AIChatService.name);

    constructor(
        @InjectRepository(ChatConversation)
        private conversationRepo: Repository<ChatConversation>,
        @InjectRepository(AIChatMessage)
        private messageRepo: Repository<AIChatMessage>,
        @InjectRepository(StudentInsight)
        private insightRepo: Repository<StudentInsight>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Question)
        private questionRepo: Repository<Question>,
        @InjectRepository(Response)
        private responseRepo: Repository<Response>,
        @InjectRepository(UserTopicMastery)
        private masteryRepo: Repository<UserTopicMastery>,
        private aiService: AIService,
        private aiUsageService: AIUsageService,
        private adaptiveLearningService: AdaptiveLearningService,
        private queueService: AIQueueService,
        private promptBuilder: PromptBuilderService,
        private aiUtils: AIUtilsService,
    ) { }

    async sendMessageStream(
        userId: string,
        userRole: UserRole,
        conversationId: string | null,
        message: string,
        questionId?: string,
        image?: { data: string; mimeType: string }
    ): Promise<{ stream: AsyncIterableIterator<string>; conversationId: string }> {
        await this.aiUsageService.checkQuota(userId, userRole);

        let conversation: ChatConversation;
        if (conversationId) {
            conversation = await this.conversationRepo.findOne({
                where: { id: conversationId, userId }
            });
            if (!conversation) throw new Error('Conversation not found');
        } else {
            const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            conversation = await this.conversationRepo.save(
                this.conversationRepo.create({ userId, title })
            );
        }

        const [user, weakAreas, allInsights] = await Promise.all([
            this.userRepo.findOne({
                where: { id: userId },
                select: ['defaultLanguage']
            }),
            this.adaptiveLearningService.getWeakAreas(userId, 5),
            this.insightRepo.find({
                where: { userId },
                order: { updatedAt: 'DESC' },
                take: 20
            })
        ]);

        let questionContext: any = null;
        let currentTopicMastery = 0.5;

        if (questionId) {
            const question = await this.questionRepo.findOne({
                where: { id: questionId },
                relations: ['subject', 'exam']
            });

            if (question) {
                const [latestResponse, mastery] = await Promise.all([
                    this.responseRepo.findOne({
                        where: { question: { id: questionId }, attempt: { user: { id: userId } } },
                        order: { answeredAt: 'DESC' },
                    }),
                    question.topic ? this.masteryRepo.findOne({
                        where: { userId, topic: question.topic }
                    }) : Promise.resolve(null)
                ]);

                if (mastery) currentTopicMastery = mastery.masteryScore;

                questionContext = {
                    content: question.content,
                    options: question.options.map((opt: any) => `${opt.id}: ${opt.text}`).join(', '),
                    correctOption: question.correctOptionId,
                    officialExplanation: question.explanation,
                    subject: question.subject?.title || 'Unknown Subject',
                    exam: question.exam?.title || 'General Competitive Exam',
                    topic: question.topic || 'General',
                    imageUrl: question.imageUrl,
                    avgTopperTime: question.avgTopperTime || 60,
                    userPerformance: latestResponse ? {
                        selectedOption: latestResponse.selectedOptionId,
                        isCorrect: latestResponse.isCorrect,
                        timeSpentSeconds: latestResponse.timeSpent,
                        wasSkipped: latestResponse.wasSkipped
                    } : null
                };
            }
        }

        // Logic to load Diagram Image if present in Question Context
        const promptImages = [];
        if (image) promptImages.push(image); // User uploaded image

        if (questionContext && questionContext.imageUrl) {
            const questionImage = await this.promptBuilder.loadQuestionImage(questionContext.imageUrl);
            if (questionImage) promptImages.push(questionImage);
        }

        const topicMatch = questionContext?.topic?.toLowerCase() || '';
        const memoryToInject = allInsights
            .filter(i => (topicMatch && i.topic.toLowerCase().includes(topicMatch)) || message.toLowerCase().includes(i.topic.toLowerCase()))
            .slice(0, 3);
        const fallbackMemory = memoryToInject.length > 0 ? memoryToInject : allInsights.slice(0, 3);

        const context = {
            weakAreas: weakAreas.map(w => ({ topic: w.topic, mastery: w.masteryScore })),
            timestamp: new Date().toISOString(),
            questionContext,
            preferredLanguage: user?.defaultLanguage || 'English',
            historicalInsights: fallbackMemory.map(i => `${i.topic}: ${i.coreStruggle}`),
            currentTopicMastery
        };

        // Save user message
        await this.messageRepo.save(
            this.messageRepo.create({
                conversationId: conversation.id,
                role: 'user',
                content: this.aiService.sanitizeInput(message),
                context,
                image,
            })
        );

        const history = await this.messageRepo.find({
            where: { conversationId: conversation.id },
            order: { createdAt: 'ASC' },
            take: 10,
        });

        const hour = new Date().getHours();
        try {
            const prompt = this.promptBuilder.buildChatPrompt({
                message: this.aiService.sanitizeInput(message),
                context: {
                    ...context,
                    temperament: {
                        isLateNight: hour >= 23 || hour <= 4,
                        isEarlyMorning: hour >= 5 && hour <= 7,
                        currentTime: new Date().toLocaleTimeString(),
                    }
                },
                history
            });

            // Execute via AIService (which handles internal queuing)
            const rawStream = await this.aiService.generateStream(prompt, promptImages, 'FAST');
            const cleanStream = this.aiUtils.cleanStreamChunk(rawStream);

            return { stream: cleanStream, conversationId: conversation.id };
        } catch (error) {
            this.logger.error(`Failed to generate chat prompt/response for conversation ${conversation.id}: ${error.message}`, error.stack);
            throw new BadRequestException('Failed to process your message. Please try again.');
        }
    }

    async saveAssistantMessage(conversationId: string, content: string, userId: string, userMsg: string) {
        const cleanContent = this.cleanAssistantResponse(content);
        // Save assistant response
        await this.messageRepo.save(
            this.messageRepo.create({
                conversationId,
                role: 'assistant',
                content: cleanContent,
            })
        );

        // Update conversation timestamp
        await this.conversationRepo.update(conversationId, { updatedAt: new Date() });

        // Extract insights
        this.extractAndSaveInsight(userId, userMsg, content).catch(err =>
            console.error('[AIChat] Insight failed:', err)
        );
    }

    /**
     * Wrapper for AIService.cleanAIResponse to be used in streaming etc.
     */
    cleanAssistantResponse(content: string): string {
        return this.aiService.cleanAIResponse(content);
    }

    async sendMessage(
        userId: string,
        userRole: UserRole,
        conversationId: string | null,
        message: string,
        questionId?: string,
        image?: { data: string; mimeType: string }
    ): Promise<SendMessageResponse> {
        await this.aiUsageService.checkQuota(userId, userRole);

        let conversation: ChatConversation;
        if (conversationId) {
            conversation = await this.conversationRepo.findOne({
                where: { id: conversationId, userId }
            });
            if (!conversation) throw new Error('Conversation not found');
        } else {
            const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
            conversation = await this.conversationRepo.save(
                this.conversationRepo.create({ userId, title })
            );
        }

        const [user, weakAreas, allInsights] = await Promise.all([
            this.userRepo.findOne({
                where: { id: userId },
                select: ['defaultLanguage']
            }),
            this.adaptiveLearningService.getWeakAreas(userId, 5),
            this.insightRepo.find({
                where: { userId },
                order: { updatedAt: 'DESC' },
                take: 20
            })
        ]);

        let questionContext: any = null;
        let currentTopicMastery = 0.5;

        if (questionId) {
            const question = await this.questionRepo.findOne({
                where: { id: questionId },
                relations: ['subject', 'exam']
            });

            if (question) {
                const [latestResponse, mastery] = await Promise.all([
                    this.responseRepo.findOne({
                        where: { question: { id: questionId }, attempt: { user: { id: userId } } },
                        order: { answeredAt: 'DESC' },
                    }),
                    question.topic ? this.masteryRepo.findOne({
                        where: { userId, topic: question.topic }
                    }) : Promise.resolve(null)
                ]);

                if (mastery) currentTopicMastery = mastery.masteryScore;

                questionContext = {
                    content: question.content,
                    options: question.options.map((opt: any) => `${opt.id}: ${opt.text}`).join(', '),
                    correctOption: question.correctOptionId,
                    officialExplanation: question.explanation,
                    subject: question.subject?.title || 'Unknown Subject',
                    exam: question.exam?.title || 'General Competitive Exam',
                    topic: question.topic || 'General',
                    imageUrl: question.imageUrl,
                    avgTopperTime: question.avgTopperTime || 60,
                    userPerformance: latestResponse ? {
                        selectedOption: latestResponse.selectedOptionId,
                        isCorrect: latestResponse.isCorrect,
                        timeSpentSeconds: latestResponse.timeSpent,
                        wasSkipped: latestResponse.wasSkipped
                    } : null
                };
            }
        }

        // Logic to load Diagram Image
        const promptImages = [];
        if (image) promptImages.push(image);

        if (questionContext && questionContext.imageUrl) {
            const questionImage = await this.promptBuilder.loadQuestionImage(questionContext.imageUrl);
            if (questionImage) promptImages.push(questionImage);
        }

        const topicMatch = questionContext?.topic?.toLowerCase() || '';
        const memoryToInject = allInsights
            .filter(i => (topicMatch && i.topic.toLowerCase().includes(topicMatch)) || message.toLowerCase().includes(i.topic.toLowerCase()))
            .slice(0, 3);
        const fallbackMemory = memoryToInject.length > 0 ? memoryToInject : allInsights.slice(0, 3);

        const context = {
            weakAreas: weakAreas.map(w => ({ topic: w.topic, mastery: w.masteryScore })),
            timestamp: new Date().toISOString(),
            questionContext,
            preferredLanguage: user?.defaultLanguage || 'English',
            historicalInsights: fallbackMemory.map(i => `${i.topic}: ${i.coreStruggle}`),
            currentTopicMastery
        };

        const userMessage = await this.messageRepo.save(
            this.messageRepo.create({
                conversationId: conversation.id,
                role: 'user',
                content: this.aiService.sanitizeInput(message),
                context,
                image,
            })
        );

        const history = await this.messageRepo.find({
            where: { conversationId: conversation.id },
            order: { createdAt: 'ASC' },
            take: 10,
        });

        const hour = new Date().getHours();
        const temperamentContext = {
            isLateNight: hour >= 23 || hour <= 4,
            isEarlyMorning: hour >= 5 && hour <= 7,
            currentTime: new Date().toLocaleTimeString(),
        };

        const prompt = this.promptBuilder.buildChatPrompt({
            message: this.aiService.sanitizeInput(message),
            context: { ...context, temperament: temperamentContext },
            history
        });

        let aiResponse: string;
        try {
            aiResponse = await this.aiService.generateText(prompt, promptImages, AIPriority.HIGH);

            aiResponse = this.aiService.cleanAIResponse(aiResponse); // Mechanically strip unwanted symbols
            await this.aiUsageService.trackUsage(userId, prompt, aiResponse);

            if (questionContext && this.shouldAudit(aiResponse, questionContext)) {
                aiResponse = await this.verifyResponse(aiResponse, questionContext);
                aiResponse = this.aiService.cleanAIResponse(aiResponse); // Clean after verification too
            }
        } catch (error) {
            console.error('[AIChat] API error:', error);
            aiResponse = "I'm having trouble connecting. Please try again in a moment.";
        }

        await this.messageRepo.save(
            this.messageRepo.create({
                conversationId: conversation.id,
                role: 'assistant',
                content: aiResponse,
            })
        );

        conversation.updatedAt = new Date();
        await this.conversationRepo.save(conversation);

        this.extractAndSaveInsight(userId, message, aiResponse).catch(err =>
            console.error('[AIChat] Insight failed:', err)
        );

        return { response: aiResponse, conversationId: conversation.id };
    }


    private shouldAudit(response: string, groundTruth: any): boolean {
        // Optimization: Only audit if response contains numbers or specific patterns suggesting factual claims
        // and if it's longer than a simple greeting.
        if (response.length < 50) return false;
        const hasNumbers = /\d+/.test(response);
        const isSocraticHint = response.includes('?') && !response.includes('correct index');
        return hasNumbers || isSocraticHint;
    }

    private async extractAndSaveInsight(userId: string, userMsg: string, aiResp: string) {
        const extractionPrompt = `You are an expert Educational Data Scientist. 
        Analyze this interaction and extract exactly ONE "Core Conceptual Struggle" if present.

        [HIDDEN THINKING]
        - First, reason about the student's mistake.
        - Determine if it's a deep conceptual gap or just a typo.
        - This thinking block will be ignored in the JSON output.

        Output JSON: {"topic": "Topic Name", "struggle": "Description", "severity": 0.1} or "NONE".
        Student: ${this.aiService.sanitizeInput(userMsg)}
        Tutor: ${aiResp}`;

        try {
            const result = await this.aiService.generateText(extractionPrompt, [], AIPriority.LOW);
            const match = result?.match(/\{[\s\S]*\}/)?.[0];
            if (match) {
                // Remove potential markdown blocks or extra characters around JSON
                const jsonStr = match.trim();
                const data = JSON.parse(jsonStr);

                if (data && data.topic && data.topic !== "NONE" && data.struggle) {
                    await this.insightRepo.save(this.insightRepo.create({
                        userId,
                        topic: data.topic,
                        coreStruggle: data.struggle,
                        severity: data.severity || 0.5
                    }));
                }
            }
        } catch (e) {
            console.error('[AIChat] Insight JSON parsing failed:', e);
        }
    }

    private async verifyResponse(response: string, groundTruth: any): Promise<string> {
        const auditPrompt = `You are a high-precision Educational Auditor. 
        Compare TUTOR RESPONSE against GROUND TRUTH. 

        [HIDDEN REASONING]
        - Analyze the ground truth logic vs tutor logic.
        - Identify any subtle math or term discrepancies.
        - This thinking block will be ignored in the output.

        Correct factual/math errors. Return same text if correct.
        
        GROUND TRUTH: Q: ${groundTruth.content} | A: ${groundTruth.correctOption}
        TUTOR: ${response}`;

        try {
            return await this.aiService.generateText(auditPrompt, [], AIPriority.HIGH) || response;
        } catch (e) {
            return response;
        }
    }

    // OLD IMPLEMENTATION - REMOVED (Now using PromptBuilderService)
    private buildContextualPromptOld(message: string, context: any, history: AIChatMessage[]): string {
        const weakAreasText = context.weakAreas.length > 0
            ? context.weakAreas.map((w: any) => `${w.topic} (${Math.round(w.mastery * 100)}%)`).join(', ')
            : 'None';

        let questionPrompt = '';
        if (context.questionContext) {
            const qc = context.questionContext;
            const perf = qc.userPerformance;
            const performanceHint = perf ? `
### STUDENT ACTION
- Selected: ${perf.selectedOption} (${perf.isCorrect ? 'Correct' : 'WRONG'})
- Time Taken: ${perf.timeSpentSeconds}s (Topper Avg: ${qc.avgTopperTime}s)
` : '';

            questionPrompt = `
### ACTIVE QUESTION
Q: ${qc.content}
Options: ${qc.options}
Correct Ans: ${qc.correctOption}
Official Explanation: ${qc.officialExplanation}
${performanceHint}
`;
        }

        const historyText = history.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Faculty'}: ${m.content}`).join('\n');

        return `You are an expert AI tutor specialized in Indian Government Examinations (SSC, Banking, Railways exams).
Your role is to teach students in a simple, structured, and exam-oriented manner.

CONTEXT:
Weak Topics: ${weakAreasText}
Language: ${context.preferredLanguage}

${questionPrompt}

HISTORY:
${historyText}

 INSTRUCTIONS:
 1. **EXTREME SHORTCUT MODE**: 
    - ALWAYS solve in **3 STEPS OR LESS**.
    - **FORBID ALGEBRA**: Strictly forbidden to use "Let X be...", "Assuming...", or long algebraic derivations.
    - **PREFERRED METHOD**: Use only the fastest SSC tricks:
      - **Deviation Method** (for Averages).
      - **Alligation** (for Ratios/Mix).
      - **Root Formula** (use $ \\\\sqrt{ab} $ for Time & Work patterns).
      - **Digital Sum / Option Elimination**.
 2. **VISUAL MATH (LaTeX)**: 
    - **MANDATE LaTeX**: Use \$ ...\$ for ALL mathematical expressions to ensure visual beauty.
    - **VISUAL SYMBOLS**: Use \\\\sqrt{...} for roots and \\\\frac{...}{...} for fractions.
    - **NO AMBIGUITY**: Use parentheses inside LaTeX where needed.
    - Example: Use \$\\\\sqrt{144}\$ for 12, and \$\\\\frac{5}{6} \\\\times 12\$ for the final step.
 3. **NO TABLES**: Use simple bullet points.
 4. **CONCISE & PUNCHY**: Every word must save the student time.
 5. **STRUCTURE**:
    - **The Shortcut** 🚀: Max 3 quick lines using ONLY standard keyboard characters.
    - **Ranker's Hack** 🔥: A 15-second logic check or mental math trick to solve this in your head.

GOAL: Provide a 30-second shortcut that allows a student to solve and move to the next question immediately.

Student: ${message}
Tutor:`;
    }

    async getConversations(userId: string): Promise<ChatConversation[]> {
        return this.conversationRepo.find({ where: { userId }, order: { updatedAt: 'DESC' }, take: 20 });
    }

    async getConversationMessages(conversationId: string, userId: string): Promise<AIChatMessage[]> {
        const conversation = await this.conversationRepo.findOne({ where: { id: conversationId, userId } });
        if (!conversation) throw new Error('Conversation not found');
        return this.messageRepo.find({ where: { conversationId }, order: { createdAt: 'ASC' } });
    }

    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.conversationRepo.findOne({ where: { id: conversationId, userId } });
        if (!conversation) throw new Error('Conversation not found');
        await this.conversationRepo.remove(conversation);
    }
}

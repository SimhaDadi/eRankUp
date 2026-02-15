import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, IsNull, Brackets } from 'typeorm';
import { Question } from '../exams/entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { QuestionExplanation } from './entities/question-explanation.entity';
import { ConfigService } from '@nestjs/config';
import { SystemHealthService } from '../admin/system-health.service';
import { AIQueueService, AIPriority } from './ai-queue.service';
import { AIUsageService } from './ai-usage.service';
import { AIService } from './ai.service';
import { UserRole } from '../users/user.entity';
import { PromptBuilderService } from './prompt-builder.service';

@Injectable()
export class ExplanationService {
    private readonly logger = new Logger(ExplanationService.name);

    constructor(
        private configService: ConfigService,
        private systemHealthService: SystemHealthService,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(QuestionExplanation)
        private explanationRepository: Repository<QuestionExplanation>,
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        private queueService: AIQueueService,
        private aiUsageService: AIUsageService,
        private aiService: AIService,
        private promptBuilder: PromptBuilderService,
    ) {
    }

    async generateExplanation(
        userId: string,
        role: UserRole,
        questionId: string,
        userAnswer?: string,
        contextExamId?: string,
        priority: AIPriority = AIPriority.MEDIUM
    ): Promise<string> {
        // 1. Check cache first
        const cached = await this.explanationRepository.findOne({
            where: { questionId, contextExamId: contextExamId || null }
        });

        if (cached) {
            cached.viewCount++;
            await this.explanationRepository.save(cached);
            return cached.adminApprovedExplanation || cached.aiExplanation;
        }

        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['subject', 'chapter', 'exams']
        });

        if (!question) {
            throw new Error('Question not found');
        }

        await this.aiUsageService.checkQuota(userId, role);

        try {
            let contextExamTitle = '';
            if (contextExamId) {
                const exam = await this.examRepository.findOne({ where: { id: contextExamId } });
                contextExamTitle = exam?.title || '';
            }

            // 5. Blind Solve Pass
            this.logger.log(`🔍 Performing Blind Solve for question ${question.id}...`);
            const solveResult = await this.aiService.solveQuestion(question);
            const isLogicalMismatch = solveResult.solvedOptionId !== question.correctOptionId && solveResult.solvedOptionId !== 'ERROR';

            if (isLogicalMismatch) {
                this.logger.warn(`⚠️ LOGICAL MISMATCH: Question ${question.id} (Stored: ${question.correctOptionId}, Solved: ${solveResult.solvedOptionId})`);
            }

            // 6. Generate Explanation using AI
            this.logger.log('📝 Building explanation prompt...');
            const prompt = this.buildPrompt(question, userAnswer, contextExamTitle, solveResult);
            this.logger.log(`✅ Prompt built successfully. Length: ${prompt.length}`);

            let explanation = '';
            let isValid = false;
            let attempts = 0;

            while (!isValid && attempts < 2) {
                // 7. Call AI Service
                this.logger.log('🚀 Calling AI Service to generate explanation...');
                const rawExplanation = await this.aiService.generateText(prompt, [], priority);
                explanation = this.aiService.cleanAIResponse(rawExplanation);
                this.logger.log(`✅ AI Service returned explanation. Length: ${explanation.length}`);

                await this.aiUsageService.trackUsage(userId, prompt, explanation);
                const verification = await this.aiService.verifyExplanation(question, explanation);
                isValid = verification.isValid;

                if (!isValid) {
                    this.logger.warn(`Generated explanation failed verification for question ${question.id}: ${verification.feedback}`);
                    attempts++;
                }
            }

            const newExplanation = this.explanationRepository.create({
                questionId,
                contextExamId: contextExamId || null,
                aiExplanation: explanation,
                isVerified: isValid,
                isLogicalMismatch,
                logicalSolveOutcome: `Solved: ${solveResult.solvedOptionId} | Logic: ${solveResult.logic}`,
                viewCount: 1
            });
            await this.explanationRepository.save(newExplanation);

            question.explanation = explanation;
            await this.questionRepository.save(question);

            return explanation;
        } catch (error) {
            // Enhanced error logging to identify the root cause
            this.logger.error('❌ AI EXPLANATION GENERATION FAILED', {
                questionId,
                errorType: error.constructor.name,
                errorMessage: error.message,
                errorStatus: error.status,
                errorResponse: error.response?.data,
                stackTrace: error.stack
            });

            // Log specific error types
            if (error.status === 429 || (error.message && error.message.includes('429'))) {
                this.logger.warn('⚠️  AI RATE LIMIT EXCEEDED - Using fallback explanation');
            } else if (error.message && error.message.includes('API key')) {
                this.logger.error('🔑 API KEY ERROR - Check your AI service configuration');
            } else if (error.message && error.message.includes('timeout')) {
                this.logger.error('⏱️  TIMEOUT ERROR - AI service took too long to respond');
            } else if (error.message && error.message.includes('network')) {
                this.logger.error('🌐 NETWORK ERROR - Cannot reach AI service');
            } else {
                this.logger.error('🔥 UNKNOWN ERROR - Check logs above for details');
            }

            const fallbackExplanation = this.getFallbackExplanation(question);

            // Save fallback so it persists (otherwise UI reverts to "Generate")
            const newExplanation = this.explanationRepository.create({
                questionId,
                contextExamId: contextExamId || null,
                aiExplanation: fallbackExplanation,
                isVerified: false,
                viewCount: 1
            });
            await this.explanationRepository.save(newExplanation);

            question.explanation = fallbackExplanation;
            await this.questionRepository.save(question);

            return fallbackExplanation;
        }
    }

    private getFallbackExplanation(question: Question): string {
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        return `The correct answer is ${question.correctOptionId}) ${correctOption?.text}. ${question.explanation || 'Please review this topic in your study materials.'}`;
    }

    private buildPrompt(question: Question, userAnswer?: string, contextExamTitle?: string, solveResult?: any): string {
        return this.promptBuilder.buildExplanationPrompt({
            question,
            userAnswer,
            contextExamTitle,
            subject: question.subject?.title,
            verifiedSolve: solveResult
        });
    }

    private async verifyExplanation(explanation: string, question: Question): Promise<{ isValid: boolean; feedback: string }> {
        return this.aiService.verifyExplanation(question, explanation);
    }



    async listExplanations(filters: {
        search?: string;
        subjectId?: string;
        chapterId?: string;
        modelId?: string;
        examId?: string;  // [FIX] Added examId filter support
        status?: 'all' | 'pending' | 'generated' | 'verified';
        limit?: number;
        offset?: number;
    }) {
        try {
            // 1. Fetch Questions with paging (Decoupled from One-to-Many Explanations for stability)
            const qb = this.questionRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.subject', 'subject')
                .leftJoinAndSelect('question.chapter', 'chapter');

            // 1.1 Core Filters
            if (filters.search) {
                qb.andWhere(new Brackets(sqb => {
                    sqb.where('question.content ILIKE :search', { search: `%${filters.search}%` })
                        .orWhere('subject.title ILIKE :search', { search: `%${filters.search}%` })
                        .orWhere('chapter.title ILIKE :search', { search: `%${filters.search}%` });
                }));
            }

            if (filters.subjectId) {
                qb.andWhere('subject.id = :subjectId', { subjectId: filters.subjectId });
            }

            if (filters.chapterId) {
                qb.andWhere('chapter.id = :chapterId', { chapterId: filters.chapterId });
            }

            // 1.2 Complex Many-to-Many Filters (Hardened via EXISTS Subqueries)
            if (filters.modelId) {
                qb.andWhere(`EXISTS (
                    SELECT 1 FROM model_questions mq 
                    WHERE mq."questionId" = question.id AND mq."modelId" = :modelId
                )`, { modelId: filters.modelId });
            }

            if (filters.examId) {
                qb.andWhere(new Brackets(sqb => {
                    // Path 1: Via Subject -> Exam
                    sqb.where('subject."examId" = :examId', { examId: filters.examId })
                        // Path 2: Direct question.examId (legacy)
                        .orWhere('question."examId" = :examId', { examId: filters.examId })
                        // Path 3: Via Question -> Exams Junction
                        .orWhere(`EXISTS (
                        SELECT 1 FROM exam_questions_question eq 
                        WHERE eq."questionId" = question.id AND eq."examId" = :examId
                    )`)
                        // Path 4: Via Question -> Models -> Exams Junction
                        .orWhere(`EXISTS (
                        SELECT 1 FROM model_questions mq 
                        JOIN exam_models em ON em."modelId" = mq."modelId"
                        WHERE mq."questionId" = question.id AND em."examId" = :examId
                    )`);
                }));
            }

            if (filters.status && filters.status !== 'all') {
                if (filters.status === 'pending') {
                    qb.andWhere(`NOT EXISTS (
                        SELECT 1 FROM question_explanation qe 
                        WHERE qe."questionId" = question.id AND qe."contextExamId" IS NULL
                    )`);
                } else if (filters.status === 'generated') {
                    qb.andWhere(`EXISTS (
                        SELECT 1 FROM question_explanation qe 
                        WHERE qe."questionId" = question.id AND qe."contextExamId" IS NULL AND qe."isVerified" = false
                    )`);
                } else if (filters.status === 'verified') {
                    qb.andWhere(`EXISTS (
                        SELECT 1 FROM question_explanation qe 
                        WHERE qe."questionId" = question.id AND qe."contextExamId" IS NULL AND qe."isVerified" = true
                    )`);
                }
            }

            qb.orderBy('question.id', 'DESC');
            qb.take(filters.limit || 50);
            qb.skip(filters.offset || 0);

            this.logger.log(`[listExplanations] Fetching ${filters.limit} questions (Paging Only)`);
            const [questions, total] = await qb.getManyAndCount();

            this.logger.log(`[listExplanations] Found ${questions?.length || 0} questions. Total count: ${total}`);

            if (!questions || questions.length === 0) {
                return { items: [], total: total || 0, limit: filters.limit || 50, offset: filters.offset || 0 };
            }

            // 2. Fetch specific global explanations for these paged questions only
            const questionIds = questions.map(q => q.id).filter(Boolean);
            let explanations: QuestionExplanation[] = [];

            try {
                this.logger.debug(`[listExplanations] Bulk loading explanations for ${questionIds.length} IDs`);
                explanations = await this.explanationRepository.find({
                    where: {
                        questionId: In(questionIds),
                        contextExamId: IsNull()
                    }
                });
                this.logger.debug(`[listExplanations] Found ${explanations.length} matching explanations`);
            } catch (explError) {
                this.logger.error(`[listExplanations] Failed to load explanations: ${explError.message}`, explError.stack);
                // Continue with empty explanations rather than crashing
                explanations = [];
            }

            // 3. Merge and Map
            const items = questions.map((q: any) => {
                if (!q) return null;
                try {
                    const explanation = explanations.find(e => String(e.questionId) === String(q.id));

                    // Defensive date handling
                    const getSafeISO = (d: any) => {
                        try {
                            const dateObj = d ? new Date(d) : new Date();
                            return isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
                        } catch {
                            return new Date().toISOString();
                        }
                    };

                    return {
                        id: explanation?.id || `missing-${q.id}`,
                        questionId: q.id,
                        questionContent: this.aiService ? this.aiService.cleanAIResponse(q.content || '') : (q.content || ''),
                        subject: q.subject?.title || 'Unknown',
                        chapter: q.chapter?.title || 'Unknown',
                        aiExplanation: (explanation?.aiExplanation && this.aiService) ? this.aiService.cleanAIResponse(explanation.aiExplanation) : (explanation?.aiExplanation || null),
                        adminApprovedExplanation: (explanation?.adminApprovedExplanation && this.aiService) ? this.aiService.cleanAIResponse(explanation.adminApprovedExplanation) : (explanation?.adminApprovedExplanation || null),
                        isVerified: !!explanation?.isVerified,
                        status: !explanation ? 'pending' : (explanation.isVerified ? 'verified' : 'generated'),
                        helpfulCount: explanation?.helpfulCount || 0,
                        notHelpfulCount: explanation?.notHelpfulCount || 0,
                        averageRating: explanation?.averageRating || 0,
                        viewCount: explanation?.viewCount || 0,
                        createdAt: getSafeISO(explanation?.createdAt || q.createdAt)
                    };
                } catch (mapError) {
                    this.logger.error(`[listExplanations] Mapping error for question ${q?.id}: ${mapError.message}`, mapError.stack);
                    return null;
                }
            }).filter(Boolean);

            return {
                items,
                total: total || 0,
                limit: filters.limit || 50,
                offset: filters.offset || 0
            };
        } catch (error) {
            this.logger.error('listExplanations failed', error.stack);
            throw error;
        }
    }

    async generateBulkExplanations(
        userId: string,
        role: UserRole,
        questionIds: string[]
    ): Promise<Map<string, string>> {
        const explanations = new Map<string, string>();
        this.logger.log(`Starting bulk generation for ${questionIds.length} questions`);

        for (const [index, questionId] of questionIds.entries()) {
            try {
                const explanation = await this.generateExplanation(userId, role, questionId, undefined, undefined, AIPriority.LOW);
                explanations.set(questionId, explanation);
                this.logger.log(`Generated ${index + 1}/${questionIds.length}: ${questionId}`);
            } catch (error) {
                this.logger.error(`Failed to generate explanation for ${questionId}: ${error.message}`, error.stack);
            }
        }

        return explanations;
    }

    async generateMissingExplanations(
        userId: string,
        role: UserRole,
        limit: number = 50
    ): Promise<number> {
        // Keeping as is, assuming it runs in background
        const qb = this.questionRepository.createQueryBuilder('question')
            .leftJoin(QuestionExplanation, 'qe', 'qe.questionId = question.id')
            .where('qe.id IS NULL')
            .take(limit);

        const questions = await qb.getMany();
        this.logger.log(`Found ${questions.length} questions missing explanations`);

        if (questions.length > 0) {
            this.generateBulkExplanations(userId, role, questions.map(q => q.id)).catch(err =>
                this.logger.error('Background generation error', err.stack)
            );
        }

        return questions.length;
    }

    async listUnverifiedExplanations() {
        const explanations = await this.explanationRepository.find({
            where: { isVerified: false },
            relations: ['question'],
            order: { createdAt: 'DESC' },
            take: 100
        });

        return {
            count: explanations.length,
            explanations: explanations.map(exp => ({
                id: exp.id,
                questionId: exp.questionId,
                questionContent: this.aiService.cleanAIResponse(exp.question?.content),
                aiExplanation: this.aiService.cleanAIResponse(exp.aiExplanation),
                helpfulCount: exp.helpfulCount,
                notHelpfulCount: exp.notHelpfulCount,
                viewCount: exp.viewCount,
                createdAt: exp.createdAt
            }))
        };
    }

    async listLogicalMismatches() {
        const mismatches = await this.explanationRepository.find({
            where: { isLogicalMismatch: true },
            relations: ['question', 'question.subject', 'question.chapter'],
            order: { createdAt: 'DESC' },
            take: 100
        });

        return {
            count: mismatches.length,
            mismatches: mismatches.map(m => ({
                id: m.id,
                questionId: m.questionId,
                questionContent: m.question?.content,
                subject: m.question?.subject?.title,
                chapter: m.question?.chapter?.title,
                storedCorrectId: m.question?.correctOptionId,
                solvedResult: m.logicalSolveOutcome,
                createdAt: m.createdAt
            }))
        };
    }

    async verifyStoredExplanation(id: string): Promise<{ isValid: boolean; feedback: string; solveResult?: any }> {
        const explanation = await this.explanationRepository.findOne({
            where: { id },
            relations: ['question', 'question.options']
        });

        if (!explanation) {
            throw new Error('Explanation not found');
        }

        // 1. Blind Solve Pass
        this.logger.log(`🔍 Verifying logic for explanation ${id}...`);
        const solveResult = await this.aiService.solveQuestion(explanation.question);

        explanation.logicalSolveOutcome = `Solved: ${solveResult.solvedOptionId} | Logic: ${solveResult.logic}`;
        explanation.isLogicalMismatch = solveResult.solvedOptionId !== explanation.question.correctOptionId && solveResult.solvedOptionId !== 'ERROR';

        // 2. Consistency Verification
        const verification = await this.aiService.verifyExplanation(
            explanation.question,
            explanation.adminApprovedExplanation || explanation.aiExplanation
        );

        if (verification.isValid) {
            explanation.isVerified = true;
            await this.explanationRepository.save(explanation);

            // Also update the question's active explanation
            await this.questionRepository.update(explanation.questionId, {
                explanation: explanation.adminApprovedExplanation || explanation.aiExplanation
            });
        } else {
            // Even if invalid, save the logical mismatch status
            await this.explanationRepository.save(explanation);
        }

        return {
            ...verification,
            solveResult
        };
    }

    async approveExplanation(id: string, editedText?: string) {
        const explanation = await this.explanationRepository.findOne({ where: { id } });

        if (!explanation) {
            throw new Error('Explanation not found');
        }

        explanation.isVerified = true;
        if (editedText) {
            explanation.adminApprovedExplanation = editedText;
        } else {
            explanation.adminApprovedExplanation = explanation.aiExplanation;
        }

        await this.explanationRepository.save(explanation);

        await this.questionRepository.update(explanation.questionId, {
            explanation: explanation.adminApprovedExplanation
        });

        return {
            success: true,
            message: 'Explanation approved',
            explanation: {
                id: explanation.id,
                isVerified: explanation.isVerified,
                approvedText: explanation.adminApprovedExplanation
            }
        };
    }

    async rejectExplanation(id: string, reason: string) {
        const explanation = await this.explanationRepository.findOne({ where: { id } });

        if (!explanation) {
            throw new Error('Explanation not found');
        }

        await this.explanationRepository.remove(explanation);

        return {
            success: true,
            message: 'Explanation rejected and removed',
            reason
        };
    }

    async updateExplanation(id: string, text: string) {
        const explanation = await this.explanationRepository.findOne({ where: { id } });

        if (!explanation) {
            throw new Error('Explanation not found');
        }

        explanation.adminApprovedExplanation = text;
        explanation.isVerified = true;

        await this.explanationRepository.save(explanation);

        await this.questionRepository.update(explanation.questionId, {
            explanation: explanation.adminApprovedExplanation
        });

        return {
            success: true,
            message: 'Explanation updated',
            explanation: {
                id: explanation.id,
                text: explanation.adminApprovedExplanation
            }
        };
    }

    async submitFeedback(questionId: string, helpful: boolean, comment?: string) {
        const explanation = await this.explanationRepository.findOne({ where: { questionId } });

        if (!explanation) {
            throw new Error('Explanation not found');
        }

        if (helpful) {
            explanation.helpfulCount++;
        } else {
            explanation.notHelpfulCount++;
        }

        const totalFeedback = explanation.helpfulCount + explanation.notHelpfulCount;
        explanation.averageRating = ((explanation.helpfulCount * 5) + (explanation.notHelpfulCount * 1)) / totalFeedback;

        await this.explanationRepository.save(explanation);

        return {
            success: true,
            message: 'Feedback submitted',
            stats: {
                helpfulCount: explanation.helpfulCount,
                notHelpfulCount: explanation.notHelpfulCount,
                averageRating: explanation.averageRating
            }
        };
    }

    async getExplanationStats() {
        const total = await this.explanationRepository.count();
        const verified = await this.explanationRepository.count({ where: { isVerified: true } });
        const unverified = total - verified;
        return {
            total,
            verified,
            unverified,
            averageRating: 0,
            totalViews: 0,
            helpfulRate: 0,
            feedback: { helpful: 0, notHelpful: 0 }
        };
    }

    async syncExplanations(): Promise<{ updated: number }> {
        const explanations = await this.explanationRepository.find();
        let updated = 0;

        for (const exp of explanations) {
            const question = await this.questionRepository.findOne({ where: { id: exp.questionId } });
            if (question && !question.explanation) {
                question.explanation = this.aiService.cleanAIResponse(exp.adminApprovedExplanation || exp.aiExplanation);
                await this.questionRepository.save(question);
                updated++;
            }
        }
        this.logger.log(`Synced ${updated} explanations to Question table.`);
        return { updated };
    }

    /**
     * Clear all explanations from the database
     * Admin only - use to regenerate all explanations with improved prompts
     */
    async clearAllExplanations(): Promise<{ deletedExplanations: number; clearedQuestions: number }> {
        this.logger.warn('⚠️  CLEARING ALL EXPLANATIONS FROM DATABASE');

        // Delete all from question_explanation table
        const deleteResult = await this.explanationRepository.delete({});
        const deletedExplanations = deleteResult.affected || 0;

        // Clear explanation field from all questions
        const updateResult = await this.questionRepository
            .createQueryBuilder()
            .update()
            .set({ explanation: null })
            .where('explanation IS NOT NULL OR explanation = :empty', { empty: '' })
            .execute();
        const clearedQuestions = updateResult.affected || 0;

        this.logger.log(`✅ Cleared ${deletedExplanations} explanation records and ${clearedQuestions} question explanations`);

        return {
            deletedExplanations,
            clearedQuestions
        };
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, IsNull, Brackets, Not } from 'typeorm';
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
import { ExplanationItem, PaginatedExplanations } from './interfaces/explanation.interfaces';
import { AIUtilsService } from './ai-utils.service';

@Injectable()
export class ExplanationService {
    private readonly logger = new Logger(ExplanationService.name);
    private readonly processingQuestions = new Set<string>();

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
        private aiUtils: AIUtilsService,
    ) {
    }

    async generateExplanation(
        userId: string,
        role: UserRole,
        questionId: string,
        userAnswer?: string,
        contextExamId?: string,
        priority: AIPriority = AIPriority.MEDIUM
    ): Promise<ExplanationItem | string> {
        // --- Curated-Only Enforcement for Students ---
        if (role === UserRole.STUDENT) {
            return this.getUnifiedExplanation(questionId, contextExamId);
        }

        this.logger.log(`[generateExplanation] ADMIN/FACULTY trigger for question=${questionId}, user=${userId}`);

        // Concurrency Guard: Check if already processing this specific question/context
        const lockKey = `${questionId}:${contextExamId || 'global'}`;
        if (this.processingQuestions.has(lockKey)) {
            this.logger.warn(`[generateExplanation] Already generating for ${lockKey}. Skipping duplicate request.`);
            return 'Generation in progress. Please wait...';
        }

        // 1. Check cache first
        try {
            const cached = await this.explanationRepository.findOne({
                where: { questionId, contextExamId: contextExamId || IsNull() }
            });

            if (cached) {
                this.logger.debug(`[generateExplanation] Cache hit for question=${questionId}`);

                // Healing Sync: Ensure Question table has the explanation for Attempt Review
                const questionExplan = cached.adminApprovedExplanation || cached.aiExplanation;
                const question = await this.questionRepository.findOne({ where: { id: questionId } });
                if (question && (!question.explanation || question.explanation.length < 5)) {
                    this.logger.log(`[generateExplanation] Healing Question Sync for q=${questionId}`);
                    question.explanation = questionExplan;
                    await this.questionRepository.save(question);
                }

                cached.viewCount++;
                await this.explanationRepository.save(cached);

                return this.mapToItem(question, cached);
            }
        } catch (cacheError) {
            this.logger.warn(`[generateExplanation] Cache lookup error: ${cacheError.message}`);
        }

        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['subject', 'chapter', 'exams']
        });

        if (!question) {
            this.logger.error(`[generateExplanation] Question not found: ${questionId}`);
            throw new Error('Question not found');
        }

        try {
            await this.aiUsageService.checkQuota(userId, role);
        } catch (quotaError) {
            this.logger.warn(`[generateExplanation] Quota blocked for user=${userId}: ${quotaError.message}`);
            throw quotaError;
        }

        let solveResult = { solvedOptionId: 'UNKNOWN', logic: 'Skipped' };
        let isLogicalMismatch = false;

        try {
            // Set Lock
            this.processingQuestions.add(lockKey);

            // 2. Blind Solve Pass
            this.logger.log(`[generateExplanation] Step 1: Blind Solve phase for ${question.id}`);
            solveResult = await this.aiService.solveQuestion(question);
            isLogicalMismatch = solveResult.solvedOptionId !== question.correctOptionId &&
                solveResult.solvedOptionId !== 'ERROR' &&
                solveResult.solvedOptionId !== 'UNKNOWN';

            if (isLogicalMismatch) {
                this.logger.warn(`[generateExplanation] LOGICAL MISMATCH: (Stored: ${question.correctOptionId}, Solved: ${solveResult.solvedOptionId})`);

                // --- PROACTIVE HEALING ---
                if (solveResult.solvedOptionId !== 'UNKNOWN' && solveResult.solvedOptionId !== 'ERROR') {
                    this.logger.log(`[generateExplanation] Proactive Truth Sync: Prioritizing ${solveResult.solvedOptionId} over ${question.correctOptionId}`);
                }
            }
        } catch (solveError) {
            this.logger.error(`[generateExplanation] Blind solve failed phase: ${solveError.message}`);
        }

        try {
            let contextExamTitle = '';
            if (contextExamId) {
                const exam = await this.examRepository.findOne({ where: { id: contextExamId } });
                contextExamTitle = exam?.title || '';
            }

            // 3. Generate Explanation using AI
            this.logger.log('[generateExplanation] Step 2: Generation phase');
            const prompt = this.buildPrompt(question, userAnswer, contextExamTitle, solveResult);

            let explanation = '';
            let isValid = false;
            let attempts = 0;

            while (!isValid && attempts < 2) {
                this.logger.log(`[generateExplanation] AI call attempt ${attempts + 1}`);
                const rawExplanation = await this.aiService.generateText(prompt, [], priority);
                explanation = this.aiUtils.cleanAIResponse(rawExplanation);

                this.logger.log(`[generateExplanation] Received response (len=${explanation.length})`);
                await this.aiUsageService.trackUsage(userId, prompt, explanation);

                try {
                    // Pass the Truth ID if there was a mismatch, so verification pass is accurate
                    const targetTruthId = isLogicalMismatch ? solveResult.solvedOptionId : question.correctOptionId;
                    const verification = await this.aiService.verifyExplanation(question, explanation, targetTruthId);
                    isValid = verification.isValid;
                    if (!isValid) this.logger.warn(`[generateExplanation] Blocked by verification: ${verification.feedback}`);
                } catch (vError) {
                    this.logger.warn(`[generateExplanation] Verification skipped: ${vError.message}`);
                    isValid = true; // Fail open
                }

                if (!isValid) attempts++;
            }

            this.logger.log(`[generateExplanation] Saving final resulting explanation (verified=${isValid})`);
            const newExplanation = this.explanationRepository.create({
                questionId,
                contextExamId: contextExamId || null,
                aiExplanation: explanation || 'Generation failed to produce text.',
                isVerified: isValid,
                isLogicalMismatch,
                logicalSolveOutcome: `Solved: ${solveResult.solvedOptionId} | Logic: ${solveResult.logic}`,
                viewCount: 1,
                createdAt: new Date()
            });
            await this.explanationRepository.save(newExplanation);

            question.explanation = explanation;
            await this.questionRepository.save(question);

            return this.mapToItem(question, newExplanation);
        } catch (error) {
            this.logger.error('[generateExplanation] FATAL pipeline failure', error.stack);

            // Generate fallback if everything else fails
            const fallbackExplanation = this.getFallbackExplanation(question, error);
            try {
                const failRecord = this.explanationRepository.create({
                    questionId,
                    contextExamId: contextExamId || null,
                    aiExplanation: fallbackExplanation,
                    isVerified: false,
                    viewCount: 1,
                    createdAt: new Date()
                });
                await this.explanationRepository.save(failRecord);
            } catch (saveError) {
                this.logger.error(`[generateExplanation] Could not even save fallback: ${saveError.message}`);
            }
            return fallbackExplanation;
        } finally {
            // Cleanup lock
            this.processingQuestions.delete(lockKey);
        }
    }

    private getFallbackExplanation(question: Question, error?: Error): string {
        try {
            const correctOptionId = question.correctOptionId || 'N/A';
            const options = question.options || [];
            const correctOption = options.find(opt => opt.id === correctOptionId);

            const baseText = `The correct answer is ${correctOptionId}${correctOption ? `) ${correctOption.text}` : ''}.`;
            const existingExplanation = question.explanation ? `\n\nExisting Logic: ${question.explanation}` : '';
            const errorReason = error ? `\n(Diagnostics: ${error.message})` : '';

            return `${baseText}${existingExplanation}\n\n[Note: AI Generation is temporarily unavailable for this question format. ${errorReason}]`;
        } catch (e) {
            return 'The correct answer is indicated in the options. Please review your textbook for the detailed logic.';
        }
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

    /**
     * Bulk version of getUnifiedExplanation for better performance
     */
    async getUnifiedExplanationsBulk(questionIds: string[], contextExamId?: string, isAdmin: boolean = false): Promise<Record<string, string>> {
        if (questionIds.length === 0) return {};

        const explanations = await this.explanationRepository.find({
            where: {
                questionId: In(questionIds),
                contextExamId: contextExamId || IsNull()
            }
        });

        const questions = await this.questionRepository.find({
            where: { id: In(questionIds) }
        });

        const result: Record<string, string> = {};

        for (const qId of questionIds) {
            const cached = explanations.find(e => e.questionId === qId);
            const q = questions.find(question => question.id === qId);

            if (isAdmin) {
                const raw = cached?.adminApprovedExplanation || cached?.aiExplanation || q?.explanation || 'No explanation available.';
                result[qId] = this.aiUtils.cleanAIResponse(raw);
                continue;
            }

            if (cached && (cached.adminApprovedExplanation || cached.isVerified)) {
                const raw = cached.adminApprovedExplanation || cached.aiExplanation;
                result[qId] = this.aiUtils.cleanAIResponse(raw);
            } else if (q?.explanation) {
                result[qId] = this.aiUtils.cleanAIResponse(q.explanation);
            } else {
                result[qId] = `### Content Under Review ⏳
This solution is currently being reviewed by our expert faculty for accuracy and formatting. 

Please check back shortly! Our team is working to ensure you get the absolute best explanation for this problem.`;

                // [Audit Fix] If student hits a missing explanation, trigger background generation
                if (!cached) {
                    this.triggerBackgroundGeneration(qId, contextExamId);
                }
            }
        }

        return result;
    }

    /**
     * Non-blocking background generation trigger
     */
    private async triggerBackgroundGeneration(questionId: string, contextExamId?: string) {
        const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
        this.generateExplanation(
            SYSTEM_USER_ID,
            UserRole.ADMIN,
            questionId,
            undefined,
            contextExamId,
            AIPriority.LOW
        ).catch(err => this.logger.error(`[BackgroundTrigger] Failed for ${questionId}: ${err.message}`));
    }

    /**
     * Get the best available explanation for a question.
     */
    async getUnifiedExplanation(questionId: string, contextExamId?: string, isAdmin: boolean = false): Promise<string> {
        try {
            const cached = await this.explanationRepository.findOne({
                where: { questionId, contextExamId: contextExamId || IsNull() }
            });

            if (isAdmin) {
                const raw = cached?.adminApprovedExplanation || cached?.aiExplanation;
                if (raw) return this.aiUtils.cleanAIResponse(raw);

                const q = await this.questionRepository.findOne({ where: { id: questionId } });
                return q?.explanation ? this.aiUtils.cleanAIResponse(q.explanation) : 'No explanation available.';
            }

            if (cached && (cached.adminApprovedExplanation || cached.isVerified)) {
                cached.viewCount++;
                await this.explanationRepository.save(cached);
                return this.aiUtils.cleanAIResponse(cached.adminApprovedExplanation || cached.aiExplanation);
            }

            const question = await this.questionRepository.findOne({ where: { id: questionId } });
            if (question?.explanation) {
                return this.aiUtils.cleanAIResponse(question.explanation);
            }

            this.triggerBackgroundGeneration(questionId, contextExamId);

            return `### Content Under Review ⏳
This solution is currently being reviewed by our expert faculty for accuracy and formatting. 

Please check back shortly! Our team is working to ensure you get the absolute best explanation for this problem.`;
        } catch (error) {
            this.logger.error(`[getUnifiedExplanation] Fetch failed for ${questionId}: ${error.message}`);
            return 'Explanation is temporarily unavailable. Please try again later.';
        }
    }

    async listExplanations(filters: {
        search?: string;
        subjectId?: string;
        chapterId?: string;
        modelId?: string;
        examId?: string;
        status?: 'all' | 'pending' | 'generated' | 'verified' | 'mismatch';
        limit?: number;
        offset?: number;
    }): Promise<PaginatedExplanations> {
        try {
            const qb = this.questionRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.subject', 'subject')
                .leftJoinAndSelect('question.chapter', 'chapter');

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

            if (filters.modelId) {
                qb.andWhere(`EXISTS (
                    SELECT 1 FROM model_questions mq 
                    WHERE mq."questionId" = question.id AND mq."modelId" = :modelId
                )`, { modelId: filters.modelId });
            }

            if (filters.examId) {
                qb.andWhere(new Brackets(sqb => {
                    sqb.where('subject."examId" = :examId', { examId: filters.examId })
                        .orWhere('question."examId" = :examId', { examId: filters.examId })
                        .orWhere(`EXISTS (
                            SELECT 1 FROM exam_questions_question eq 
                            WHERE eq."questionId" = question.id AND eq."examId" = :examId
                        )`)
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
                } else if (filters.status === 'mismatch') {
                    qb.andWhere(`EXISTS (
                        SELECT 1 FROM question_explanation qe 
                        WHERE qe."questionId" = question.id AND qe."contextExamId" IS NULL AND qe."isLogicalMismatch" = true
                    )`);
                }
            }

            qb.orderBy('question.id', 'DESC');
            qb.take(filters.limit || 50);
            qb.skip(filters.offset || 0);

            this.logger.debug(`[listExplanations] Executing query with filters: ${JSON.stringify(filters)}`);
            const [questions, total] = await qb.getManyAndCount();
            this.logger.debug(`[listExplanations] Found ${questions.length} questions, total count ${total}`);

            if (!questions || questions.length === 0) {
                return { items: [], total: total || 0, limit: filters.limit || 50, offset: filters.offset || 0 };
            }

            const questionIds = questions.map(q => q.id).filter(Boolean);
            const explanations = await this.explanationRepository.createQueryBuilder('qe')
                .leftJoinAndSelect('qe.question', 'question')
                .where('qe.questionId IN (:...ids)', { ids: questionIds })
                .andWhere('qe.contextExamId IS NULL')
                .getMany();

            this.logger.debug(`[listExplanations] Found ${explanations.length} matching explanation records`);

            const items = questions.map((q: any) => {
                const qId = String(q.id).toLowerCase();
                const explanationMatch = explanations.find(e => {
                    const targetId = e.questionId || e.question?.id;
                    return targetId && String(targetId).toLowerCase() === qId;
                });
                return this.mapToItem(q, explanationMatch);
            }).filter(Boolean);

            this.logger.debug(`[listExplanations] mapped ${items.length} items for response`);

            return {
                items,
                total: typeof total === 'string' ? parseInt(total) : total,
                limit: filters.limit || 50,
                offset: filters.offset || 0
            };
        } catch (error) {
            this.logger.error(`[listExplanations] FATAL ERROR: ${error.message}`, error.stack);
            throw error;
        }
    }

    async generateBulkExplanations(
        userId: string,
        role: UserRole,
        questionIds: string[]
    ): Promise<Map<string, string>> {
        const explanations = new Map<string, string>();
        for (const questionId of questionIds) {
            try {
                const result = await this.generateExplanation(userId, role, questionId, undefined, undefined, AIPriority.LOW);
                const explanation = typeof result === 'string' ? result : (result.adminApprovedExplanation || result.aiExplanation || '');
                explanations.set(questionId, explanation);
            } catch (error) {
                this.logger.error(`Failed to generate explanation for ${questionId}: ${error.message}`);
            }
        }
        return explanations;
    }

    async generateMissingExplanations(
        userId: string,
        role: UserRole,
        limit: number = 50
    ): Promise<number> {
        const qb = this.questionRepository.createQueryBuilder('question')
            .leftJoin(QuestionExplanation, 'qe', 'qe.questionId = question.id AND qe.contextExamId IS NULL')
            .where('qe.id IS NULL')
            .take(limit);

        const questions = await qb.getMany();
        this.logger.log(`Found ${questions.length} questions missing global explanations`);

        if (questions.length > 0) {
            this.generateBulkExplanations(userId, role, questions.map(q => q.id)).catch(err =>
                this.logger.error('Background bulk generation error', err.stack)
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
                questionContent: this.aiUtils.cleanAIResponse(exp.question?.content || ''),
                aiExplanation: this.aiUtils.cleanAIResponse(exp.aiExplanation),
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

    async verifyStoredExplanation(id: string): Promise<{ isValid: boolean; feedback: string; solveResult?: any; item: any }> {
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
        const solvedId = solveResult.solvedOptionId;

        explanation.logicalSolveOutcome = `Solved: ${solvedId} | Logic: ${solveResult.logic}`;
        explanation.isLogicalMismatch = solvedId !== explanation.question.correctOptionId &&
            solvedId !== 'ERROR' &&
            solvedId !== 'UNKNOWN';

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
            solveResult,
            item: this.mapToItem(explanation.question, explanation)
        };
    }

    private async resolveExplanation(id: string): Promise<QuestionExplanation> {
        if (!id.startsWith('missing-')) {
            const explanation = await this.explanationRepository.findOne({
                where: { id },
                relations: ['question', 'question.subject', 'question.chapter']
            });
            if (!explanation) throw new Error('Explanation not found');
            return explanation;
        }

        const questionId = id.replace('missing-', '');
        this.logger.log(`[resolveExplanation] Resolving legacy placeholder for question: ${questionId}`);

        // Double check if a record was created by someone else/background in the meantime
        let explanation = await this.explanationRepository.findOne({
            where: { questionId, contextExamId: IsNull() },
            relations: ['question', 'question.subject', 'question.chapter']
        });

        if (!explanation) {
            const question = await this.questionRepository.findOne({
                where: { id: questionId },
                relations: ['subject', 'chapter']
            });
            if (!question) throw new Error('Question not found');

            this.logger.log(`[resolveExplanation] Creating new QuestionExplanation record from legacy content for q=${questionId}`);
            explanation = this.explanationRepository.create({
                questionId,
                aiExplanation: question.explanation || 'Legacy explanation content missing.',
                isVerified: false,
                createdAt: new Date()
            });
            explanation.question = question;
            await this.explanationRepository.save(explanation);
        }

        return explanation;
    }

    async approveExplanation(id: string, editedText?: string) {
        const explanation = await this.resolveExplanation(id);

        explanation.isVerified = true;
        explanation.adminApprovedExplanation = editedText || explanation.aiExplanation;

        // --- ANSWER KEY HEALING ---
        // If the question is missing its correctOptionId, try to heal it using the AI's solve result
        const question = explanation.question;
        const updates: any = { explanation: explanation.adminApprovedExplanation };

        if (!question.correctOptionId || question.correctOptionId === 'UNKNOWN') {
            const solveMatch = explanation.logicalSolveOutcome?.match(/Solved:\s*([A-E])/i);
            if (solveMatch) {
                const discoveredAnswer = solveMatch[1].toUpperCase();
                this.logger.log(`[approveExplanation] ✨ HEALING Answer Key for question ${question.id}: ${discoveredAnswer}`);
                updates.correctOptionId = discoveredAnswer;

                // Update the local explanation object too so mapToItem returns the correct state
                question.correctOptionId = discoveredAnswer;
            }
        }

        await this.explanationRepository.save(explanation);
        await this.questionRepository.update(explanation.questionId, updates);

        return {
            success: true,
            message: updates.correctOptionId ? 'Explanation approved and Answer Key healed' : 'Explanation approved',
            item: this.mapToItem(question, explanation)
        };
    }

    async rejectExplanation(id: string, reason: string) {
        const explanation = await this.resolveExplanation(id);

        await this.questionRepository.update(explanation.questionId, { explanation: null });
        await this.explanationRepository.remove(explanation);

        return { success: true, message: 'Explanation rejected and removed', reason };
    }

    async updateExplanation(id: string, text: string) {
        const explanation = await this.resolveExplanation(id);

        explanation.adminApprovedExplanation = text;
        explanation.isVerified = true;

        await this.explanationRepository.save(explanation);
        await this.questionRepository.update(explanation.questionId, {
            explanation: explanation.adminApprovedExplanation
        });

        return {
            success: true,
            message: 'Explanation updated',
            item: this.mapToItem(explanation.question, explanation)
        };
    }

    async submitFeedback(questionId: string, helpful: boolean, comment?: string) {
        const explanation = await this.explanationRepository.findOne({ where: { questionId } });
        if (!explanation) throw new Error('Explanation not found');

        if (helpful) explanation.helpfulCount++;
        else explanation.notHelpfulCount++;

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

    /**
     * Clears logical mismatch flag when admin explicitly updates the answer key.
     * Called after PATCH /questions/:id to resolve the conflict.
     */
    async syncMismatchStatus(questionId: string, newCorrectOptionId: string) {
        // BUG FIX 1: Must filter by contextExamId IS NULL to target the global record.
        // Without this, findOne could return an exam-specific record that has no mismatch,
        // causing an early return and leaving the global mismatch record untouched.
        const explanation = await this.explanationRepository.findOne({
            where: { questionId, contextExamId: IsNull() }
        });

        if (!explanation) {
            this.logger.warn(`[syncMismatchStatus] No global explanation record found for Q:${questionId}`);
            return;
        }

        if (!explanation.isLogicalMismatch) {
            this.logger.debug(`[syncMismatchStatus] No mismatch flag set for Q:${questionId}, nothing to clear.`);
            return;
        }

        // BUG FIX 2: Always clear the mismatch when the admin explicitly acts.
        // The admin's Quick Fix action IS the resolution — we don't need to re-validate
        // whether the new answer matches what the AI proposed. Admin reviewed it and decided.
        this.logger.log(`[syncMismatchStatus] Admin resolved mismatch for Q:${questionId}. New answer: ${newCorrectOptionId}. Clearing flag.`);
        explanation.isLogicalMismatch = false;
        explanation.isVerified = true;
        await this.explanationRepository.save(explanation);
    }

    async getExplanationStats() {
        const total = await this.explanationRepository.count();
        const verified = await this.explanationRepository.count({ where: { isVerified: true } });
        const mismatches = await this.explanationRepository.count({ where: { isLogicalMismatch: true } });

        const { totalViews } = await this.explanationRepository
            .createQueryBuilder('qe')
            .select('SUM(qe.viewCount)', 'totalViews')
            .getRawOne();

        return {
            total,
            verified,
            unverified: total - verified,
            mismatches,
            totalViews: parseInt(totalViews || '0'),
            averageRating: 0,
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
                question.explanation = this.aiUtils.cleanAIResponse(exp.adminApprovedExplanation || exp.aiExplanation);
                await this.questionRepository.save(question);
                updated++;
            }
        }
        return { updated };
    }

    async backfillLegacyExplanations(): Promise<{ total: number; synced: number }> {
        const questionsWithLegacy = await this.questionRepository.find({
            where: { explanation: Not(IsNull()) }
        });

        let synced = 0;
        for (const q of questionsWithLegacy) {
            const existing = await this.explanationRepository.findOne({ where: { questionId: q.id } });
            if (!existing) {
                const newExpr = this.explanationRepository.create({
                    questionId: q.id,
                    aiExplanation: q.explanation,
                    isVerified: false,
                    createdAt: q.createdAt || new Date()
                });
                await this.explanationRepository.save(newExpr);
                synced++;
            }
        }
        return { total: questionsWithLegacy.length, synced };
    }

    private mapToItem(q: Question, explanationMatch?: QuestionExplanation): ExplanationItem {
        try {
            const rawAiExpl = explanationMatch?.aiExplanation || q.explanation || null;
            const getSafeISO = (d: any) => {
                try {
                    const dateObj = d ? new Date(d) : new Date();
                    return isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
                } catch { return new Date().toISOString(); }
            };

            const cleanQuestion = this.aiUtils.cleanAIResponse(q.content || '');
            const cleanAiExpl = rawAiExpl ? this.aiUtils.cleanAIResponse(rawAiExpl) : null;
            const cleanAdminExpl = explanationMatch?.adminApprovedExplanation ? this.aiUtils.cleanAIResponse(explanationMatch.adminApprovedExplanation) : null;

            return {
                id: explanationMatch?.id || `missing-${q.id}`,
                questionId: q.id,
                questionContent: cleanQuestion,
                subject: q.subject?.title || 'Unknown',
                chapter: q.chapter?.title || 'Unknown',
                aiExplanation: cleanAiExpl,
                adminApprovedExplanation: cleanAdminExpl,
                isVerified: !!explanationMatch?.isVerified,
                isLogicalMismatch: !!explanationMatch?.isLogicalMismatch,
                logicalSolveOutcome: explanationMatch?.logicalSolveOutcome || null,
                status: (explanationMatch?.isVerified) ? 'verified' : ((rawAiExpl) ? 'generated' : 'pending'),
                helpfulCount: explanationMatch?.helpfulCount || 0,
                notHelpfulCount: explanationMatch?.notHelpfulCount || 0,
                averageRating: explanationMatch?.averageRating || 0,
                viewCount: explanationMatch?.viewCount || 0,
                createdAt: getSafeISO(explanationMatch?.createdAt || q.createdAt),
                options: q.options?.map(opt => ({ id: opt.id, text: this.aiUtils.cleanAIResponse(opt.text) })),
                correctOptionId: q.correctOptionId,
                isMissingAnswerKey: !q.correctOptionId || q.correctOptionId === 'UNKNOWN',
                aiProposedAnswerId: (explanationMatch?.logicalSolveOutcome?.match(/Solved:\s*([A-E])/i)?.[1] ||
                    explanationMatch?.logicalSolveOutcome?.match(/Answer:\s*([A-E])/i)?.[1])?.toUpperCase()
            };
        } catch (mapError) {
            this.logger.error(`[mapToItem] Error for question ${q?.id}: ${mapError.message}`);
            return null;
        }
    }

    async clearAllExplanations(): Promise<{ deletedExplanations: number; clearedQuestions: number }> {
        const deleteResult = await this.explanationRepository.delete({});
        const deletedExplanations = deleteResult.affected || 0;

        const updateResult = await this.questionRepository
            .createQueryBuilder()
            .update()
            .set({ explanation: null })
            .where('explanation IS NOT NULL OR explanation = :empty', { empty: '' })
            .execute();
        const clearedQuestions = updateResult.affected || 0;

        return { deletedExplanations, clearedQuestions };
    }
}

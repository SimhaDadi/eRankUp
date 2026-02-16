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
import { ExplanationItem, PaginatedExplanations } from './interfaces/explanation.interfaces';

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
    ): Promise<ExplanationItem | string> {
        // --- Curated-Only Enforcement for Students ---
        if (role === UserRole.STUDENT) {
            return this.getCuratedExplanation(questionId, contextExamId);
        }

        this.logger.log(`[generateExplanation] ADMIN/FACULTY trigger for question=${questionId}, user=${userId}`);

        // 1. Check cache first
        try {
            const cached = await this.explanationRepository.findOne({
                where: { questionId, contextExamId: contextExamId || IsNull() }
            });

            if (cached) {
                this.logger.debug(`[generateExplanation] Cache hit for question=${questionId}`);

                // [FIX] Healing Sync: Ensure Question table has the explanation for Attempt Review
                const questionExplan = cached.adminApprovedExplanation || cached.aiExplanation;
                const question = await this.questionRepository.findOne({ where: { id: questionId } });
                if (question && (!question.explanation || question.explanation.length < 5)) {
                    this.logger.log(`[generateExplanation] Healing Question Sync for q=${questionId}`);
                    question.explanation = questionExplan;
                    await this.questionRepository.save(question);
                }

                cached.viewCount++;
                await this.explanationRepository.save(cached);

                // Standardize: Always return the mapped item for consistent metadata access
                return this.mapToItem(question, cached);
            }
        } catch (cacheError) {
            this.logger.warn(`[generateExplanation] Cache lookup error: ${cacheError.message}`);
            // Continue to generation
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
            // 2. Blind Solve Pass
            this.logger.log(`[generateExplanation] Step 1: Blind Solve phase for ${question.id}`);
            solveResult = await this.aiService.solveQuestion(question);
            isLogicalMismatch = solveResult.solvedOptionId !== question.correctOptionId && solveResult.solvedOptionId !== 'ERROR';

            if (isLogicalMismatch) {
                this.logger.warn(`[generateExplanation] LOGICAL MISMATCH: (Stored: ${question.correctOptionId}, Solved: ${solveResult.solvedOptionId})`);
            }
        } catch (solveError) {
            this.logger.error(`[generateExplanation] Blind solve failed phase: ${solveError.message}`);
            // Continue anyway
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
                explanation = this.aiService.cleanAIResponse(rawExplanation);

                this.logger.log(`[generateExplanation] Received response (len=${explanation.length})`);
                await this.aiUsageService.trackUsage(userId, prompt, explanation);

                try {
                    const verification = await this.aiService.verifyExplanation(question, explanation);
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

            // [NEW] Return the full UI-ready item for immediate frontend sync
            return this.mapToItem(question, newExplanation);
        } catch (error) {
            this.logger.error('[generateExplanation] FATAL pipeline failure', error.stack);

            const fallbackExplanation = this.getFallbackExplanation(question);

            try {
                // Persistent save of fallback to satisfy UI
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
        }
    }

    private getFallbackExplanation(question: Question): string {
        try {
            const correctOptionId = question.correctOptionId || 'N/A';
            const options = question.options || [];
            const correctOption = options.find(opt => opt.id === correctOptionId);

            const baseText = `The correct answer is ${correctOptionId}${correctOption ? `) ${correctOption.text}` : ''}.`;
            const existingExplanation = question.explanation ? `\n\nExisting Logic: ${question.explanation}` : '';

            return `${baseText}${existingExplanation}\n\n[Note: AI Generation is temporarily unavailable for this question format.]`;
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

    private async verifyExplanation(explanation: string, question: Question): Promise<{ isValid: boolean; feedback: string }> {
        return this.aiService.verifyExplanation(question, explanation);
    }

    /**
     * Strictly fetch curated content for students.
     * Returns a "Pending" message if not verified or approved.
     */
    private async getCuratedExplanation(questionId: string, contextExamId?: string): Promise<string> {
        try {
            const cached = await this.explanationRepository.findOne({
                where: { questionId, contextExamId: contextExamId || IsNull() }
            });

            // Rule: Only show to students if Admin Approved OR AI Verified
            if (cached && (cached.adminApprovedExplanation || cached.isVerified)) {
                cached.viewCount++;
                await this.explanationRepository.save(cached);
                return cached.adminApprovedExplanation || cached.aiExplanation;
            }

            // Otherwise, return the "Safety Shield" message
            return `### Content Under Review ⏳
This solution is currently being reviewed by our expert faculty for accuracy and formatting. 

Please check back shortly! Our team is working to ensure you get the absolute best explanation for this problem.`;
        } catch (error) {
            this.logger.error(`[getCuratedExplanation] Fetch failed for ${questionId}: ${error.message}`);
            return 'Explanation is temporarily unavailable. Please try again later.';
        }
    }



    async listExplanations(filters: {
        search?: string;
        subjectId?: string;
        chapterId?: string;
        modelId?: string;
        examId?: string;  // [FIX] Added examId filter support
        status?: 'all' | 'pending' | 'generated' | 'verified' | 'mismatch';
        limit?: number;
        offset?: number;
    }): Promise<PaginatedExplanations> {
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
                // Use QueryBuilder to force-load columns if needed and filter correctly
                // [FIX] Explicitly join question to be sure we have the reference if qe.questionId is flaky
                explanations = await this.explanationRepository.createQueryBuilder('qe')
                    .leftJoinAndSelect('qe.question', 'question')
                    .where('qe.questionId IN (:...ids)', { ids: questionIds })
                    .andWhere('qe.contextExamId IS NULL')
                    .getMany();

                this.logger.log(`[listExplanations] Found ${explanations.length} matching explanations. Example qId from first: ${explanations[0]?.questionId || explanations[0]?.question?.id}`);
            } catch (explError) {
                this.logger.error(`[listExplanations] Failed to load explanations: ${explError.message}`, explError.stack);
                explanations = [];
            }

            // 3. Merge and Map
            const items = questions.map((q: any) => {
                if (!q) return null;
                const qId = String(q.id).toLowerCase();
                const explanationMatch = explanations.find(e => {
                    const targetId = e.questionId || e.question?.id;
                    return targetId && String(targetId).toLowerCase() === qId;
                });
                return this.mapToItem(q, explanationMatch);
            }).filter(Boolean);

            this.logger.log(`[listExplanations] Mapping complete. Items: ${items.length}, Pending: ${items.filter(i => i.status === 'pending').length}`);

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
                const result = await this.generateExplanation(userId, role, questionId, undefined, undefined, AIPriority.LOW);
                const explanation = typeof result === 'string' ? result : (result.adminApprovedExplanation || result.aiExplanation || '');
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
            solveResult,
            item: this.mapToItem(explanation.question, explanation)
        };
    }

    async approveExplanation(id: string, editedText?: string) {
        const explanation = await this.explanationRepository.findOne({
            where: { id },
            relations: ['question', 'question.subject', 'question.chapter']
        });

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
            item: this.mapToItem(explanation.question, explanation)
        };
    }

    async rejectExplanation(id: string, reason: string) {
        const explanation = await this.explanationRepository.findOne({ where: { id } });

        if (!explanation) {
            throw new Error('Explanation not found');
        }

        // [FIX] Sync: Clear explanation field from the Question entity
        await this.questionRepository.update(explanation.questionId, {
            explanation: null
        });

        await this.explanationRepository.remove(explanation);

        return {
            success: true,
            message: 'Explanation rejected and removed',
            reason
        };
    }

    async updateExplanation(id: string, text: string) {
        const explanation = await this.explanationRepository.findOne({
            where: { id },
            relations: ['question', 'question.subject', 'question.chapter']
        });

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
            item: this.mapToItem(explanation.question, explanation)
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
     * Map a Question and its (optional) Explanation record to a UI-friendly item
     */
    private mapToItem(q: Question, explanationMatch?: QuestionExplanation): ExplanationItem {
        try {
            // [FIX] Use the cached question.explanation as a fallback to ensure visibility
            const rawAiExpl = explanationMatch?.aiExplanation || q.explanation || null;

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
                id: explanationMatch?.id || `missing-${q.id}`,
                questionId: q.id,
                questionContent: this.aiService ? this.aiService.cleanAIResponse(q.content || '') : (q.content || ''),
                subject: q.subject?.title || 'Unknown',
                chapter: q.chapter?.title || 'Unknown',
                aiExplanation: (rawAiExpl && this.aiService) ? this.aiService.cleanAIResponse(rawAiExpl) : (rawAiExpl || null),
                adminApprovedExplanation: (explanationMatch?.adminApprovedExplanation && this.aiService) ? this.aiService.cleanAIResponse(explanationMatch.adminApprovedExplanation) : (explanationMatch?.adminApprovedExplanation || null),
                isVerified: !!explanationMatch?.isVerified,
                isLogicalMismatch: !!explanationMatch?.isLogicalMismatch,
                logicalSolveOutcome: explanationMatch?.logicalSolveOutcome || null,
                status: (!explanationMatch && !q.explanation) ? 'pending' : (explanationMatch?.isVerified ? 'verified' : 'generated'),
                helpfulCount: explanationMatch?.helpfulCount || 0,
                notHelpfulCount: explanationMatch?.notHelpfulCount || 0,
                averageRating: explanationMatch?.averageRating || 0,
                viewCount: explanationMatch?.viewCount || 0,
                createdAt: getSafeISO(explanationMatch?.createdAt || q.createdAt)
            };
        } catch (mapError) {
            this.logger.error(`[mapToItem] Error for question ${q?.id}: ${mapError.message}`, mapError.stack);
            return null;
        }
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

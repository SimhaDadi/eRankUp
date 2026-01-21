import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Question } from '../exams/entities/question.entity';
import { QuestionExplanation } from './entities/question-explanation.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExplanationService {
    private genAI: GoogleGenerativeAI;
    private model;
    private isInitialized = false;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(QuestionExplanation)
        private explanationRepository: Repository<QuestionExplanation>,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (!apiKey) {
            console.warn('⚠️  GEMINI_API_KEY not set. AI explanations will use fallback mode.');
            console.warn('Get your free API key: https://makersuite.google.com/app/apikey');
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.isInitialized = true;
        console.log('✅ Gemini 1.5 Flash initialized successfully');
    }

    async generateExplanation(
        questionId: string,
        userAnswer?: string
    ): Promise<string> {
        // 1. Check cache first
        const cached = await this.explanationRepository.findOne({
            where: { questionId }
        });

        if (cached) {
            // Update view count
            cached.viewCount++;
            await this.explanationRepository.save(cached);

            // Return admin-approved if available, otherwise AI-generated
            return cached.adminApprovedExplanation || cached.aiExplanation;
        }

        // 2. Fetch question
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['subject', 'chapter', 'exam']
        });

        if (!question) {
            throw new Error('Question not found');
        }

        // 3. Fallback if AI not initialized
        if (!this.isInitialized) {
            return this.getFallbackExplanation(question);
        }

        try {
            // 4. Generate with AI
            const prompt = this.buildPrompt(question, userAnswer);
            const result = await this.model.generateContent(prompt);
            const explanation = result.response.text();

            // 5. Cache the explanation
            const newExplanation = this.explanationRepository.create({
                questionId,
                aiExplanation: explanation,
                viewCount: 1
            });
            await this.explanationRepository.save(newExplanation);

            return explanation;
        } catch (error) {
            console.error('AI generation failed:', error);
            return this.getFallbackExplanation(question);
        }
    }

    private getFallbackExplanation(question: Question): string {
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        return `The correct answer is ${question.correctOptionId}) ${correctOption?.text}. ${question.explanation || 'Please review this topic in your study materials.'}`;
    }

    private buildPrompt(question: Question, userAnswer?: string): string {
        const examContext = question.exam?.title || 'competitive exam';
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        const userOption = userAnswer ? question.options.find(opt => opt.id === userAnswer) : null;

        let prompt = `You are an expert tutor for ${examContext} in India.

Question: ${question.content}

Options:
${question.options.map(opt => `${opt.id}) ${opt.text}`).join('\n')}

Correct Answer: ${question.correctOptionId}) ${correctOption?.text}
`;

        if (userAnswer && userAnswer !== question.correctOptionId) {
            prompt += `Student's Answer: ${userAnswer}) ${userOption?.text}\n`;
        }

        prompt += `
Topic: ${question.topic}
${question.chapter ? `Chapter: ${question.chapter.title}` : ''}

Provide a clear, encouraging explanation in simple English (use Hindi terms where helpful for Indian students):

1. **Why the correct answer is right**: Explain the concept clearly
2. **Common mistake**: ${userAnswer && userAnswer !== question.correctOptionId ? 'Why the student\'s answer is incorrect' : 'What students often get wrong'}
3. **Key concept**: Brief explanation of the underlying principle
4. **Memory tip**: A simple trick to remember this

Keep it under 150 words. Be encouraging and educational.`;

        return prompt;
    }

    async generateBulkExplanations(questionIds: string[]): Promise<Map<string, string>> {
        const explanations = new Map<string, string>();

        for (const questionId of questionIds) {
            try {
                const explanation = await this.generateExplanation(questionId);
                explanations.set(questionId, explanation);

                // Free tier: 15 RPM = 4 seconds between requests
                await new Promise(resolve => setTimeout(resolve, 4000));
            } catch (error) {
                console.error(`Failed to generate explanation for ${questionId}:`, error);
            }
        }

        return explanations;
    }

    async listExplanations(filters: {
        verified?: boolean;
        minRating?: number;
        limit?: number;
        offset?: number;
    }) {
        const queryBuilder = this.explanationRepository
            .createQueryBuilder('explanation')
            .leftJoinAndSelect('explanation.question', 'question')
            .orderBy('explanation.createdAt', 'DESC')
            .take(filters.limit || 50)
            .skip(filters.offset || 0);

        if (filters.verified !== undefined) {
            queryBuilder.andWhere('explanation.isVerified = :verified', { verified: filters.verified });
        }

        if (filters.minRating) {
            queryBuilder.andWhere('explanation.averageRating >= :minRating', { minRating: filters.minRating });
        }

        const [explanations, total] = await queryBuilder.getManyAndCount();

        return {
            explanations: explanations.map(exp => ({
                id: exp.id,
                questionId: exp.questionId,
                questionContent: exp.question?.content,
                aiExplanation: exp.aiExplanation,
                adminApprovedExplanation: exp.adminApprovedExplanation,
                isVerified: exp.isVerified,
                helpfulCount: exp.helpfulCount,
                notHelpfulCount: exp.notHelpfulCount,
                averageRating: exp.averageRating,
                viewCount: exp.viewCount,
                createdAt: exp.createdAt
            })),
            total,
            limit: filters.limit || 50,
            offset: filters.offset || 0
        };
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
                questionContent: exp.question?.content,
                aiExplanation: exp.aiExplanation,
                helpfulCount: exp.helpfulCount,
                notHelpfulCount: exp.notHelpfulCount,
                viewCount: exp.viewCount,
                createdAt: exp.createdAt
            }))
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

        // Delete rejected explanation
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

        // Calculate average rating (helpful = 5 stars, not helpful = 1 star)
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

        const avgRatingResult = await this.explanationRepository
            .createQueryBuilder('explanation')
            .select('AVG(explanation.averageRating)', 'avgRating')
            .getRawOne();

        const totalViews = await this.explanationRepository
            .createQueryBuilder('explanation')
            .select('SUM(explanation.viewCount)', 'totalViews')
            .getRawOne();

        const totalHelpful = await this.explanationRepository
            .createQueryBuilder('explanation')
            .select('SUM(explanation.helpfulCount)', 'totalHelpful')
            .getRawOne();

        const totalNotHelpful = await this.explanationRepository
            .createQueryBuilder('explanation')
            .select('SUM(explanation.notHelpfulCount)', 'totalNotHelpful')
            .getRawOne();

        const helpfulRate = totalHelpful.totalHelpful && totalNotHelpful.totalNotHelpful
            ? (totalHelpful.totalHelpful / (totalHelpful.totalHelpful + totalNotHelpful.totalNotHelpful)) * 100
            : 0;

        return {
            total,
            verified,
            unverified,
            averageRating: parseFloat(avgRatingResult.avgRating) || 0,
            totalViews: parseInt(totalViews.totalViews) || 0,
            helpfulRate: Math.round(helpfulRate),
            feedback: {
                helpful: parseInt(totalHelpful.totalHelpful) || 0,
                notHelpful: parseInt(totalNotHelpful.totalNotHelpful) || 0
            }
        };
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTopicMastery } from './entities/user-topic-mastery.entity';
import { LearningPath, TopicRecommendation } from './entities/learning-path.entity';
import { Question } from '../exams/entities/question.entity';
import { Response } from '../exams/entities/response.entity';
import { AIService } from '../ai/ai.service';

@Injectable()
export class AdaptiveLearningService {
    private readonly logger = new Logger(AdaptiveLearningService.name);

    constructor(
        @InjectRepository(UserTopicMastery)
        private masteryRepo: Repository<UserTopicMastery>,
        @InjectRepository(LearningPath)
        private pathRepo: Repository<LearningPath>,
        @InjectRepository(Question)
        private questionRepo: Repository<Question>,
        @InjectRepository(Response)
        private responseRepo: Repository<Response>,
        private aiService: AIService,
    ) { }

    async calculateMasteryScore(userId: string, topic: string, existingMastery?: UserTopicMastery): Promise<number> {
        let mastery = existingMastery;

        if (!mastery) {
            mastery = await this.masteryRepo.findOne({
                where: { userId, topic },
            });
        }

        if (!mastery || mastery.totalAttempts === 0) {
            return 0;
        }

        const accuracy = mastery.correctAttempts / mastery.totalAttempts;

        // Use overall accuracy as performance metric
        // (Response entity doesn't have userId field for direct querying)
        const recentPerformance = accuracy;

        // Calculate recency weight (recent performance matters more)
        const daysSinceLastPractice = mastery.lastPracticedAt
            ? Math.floor((Date.now() - mastery.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        const recencyFactor = Math.max(0, 1 - (daysSinceLastPractice / 30)); // Decay over 30 days

        // Weighted mastery score
        const masteryScore = (
            accuracy * 0.5 +           // Historical accuracy
            recentPerformance * 0.3 +  // Recent performance
            recencyFactor * 0.2        // Recency bonus
        );

        return Math.min(1, Math.max(0, masteryScore));
    }

    async updateTopicMastery(userId: string, responses: Response[]): Promise<void> {
        const topicStats = new Map<string, { correct: number; total: number; lastWrongResponse?: Response }>();

        // Aggregate by topic
        for (const response of responses) {
            // Safety check: ensure question relation is loaded
            if (!response.question) {
                this.logger.warn(`Response ${response.id} missing question relation`);
                continue;
            }

            const topic = response.question.topic || 'General';
            const stats = topicStats.get(topic) || { correct: 0, total: 0 };
            stats.total++;
            if (response.isCorrect) {
                stats.correct++;
            } else {
                stats.lastWrongResponse = response;
            }
            topicStats.set(topic, stats);
        }

        // Update each topic in parallel
        await Promise.all(Array.from(topicStats.entries()).map(async ([topic, stats]) => {
            let mastery = await this.masteryRepo.findOne({
                where: { userId, topic },
            });

            if (!mastery) {
                mastery = this.masteryRepo.create({
                    userId,
                    topic,
                    totalAttempts: 0,
                    correctAttempts: 0,
                });
            }

            mastery.totalAttempts += stats.total;
            mastery.correctAttempts += stats.correct;
            mastery.lastPracticedAt = new Date();
            mastery.masteryScore = await this.calculateMasteryScore(userId, topic, mastery);

            // AI Cognitive Analysis for wrong answers
            if (stats.lastWrongResponse) {
                try {
                    const analysis = await this.aiService.analyzeWrongAnswer(
                        stats.lastWrongResponse.question,
                        stats.lastWrongResponse.selectedOptionId
                    );
                    mastery.lastErrorPattern = analysis.pattern;
                    mastery.cognitiveAdvice = analysis.advice;
                } catch (error) {
                    this.logger.error('AI analysis failed', error.stack);
                }
            }

            await this.masteryRepo.save(mastery);
        }));
    }

    async generateAdaptiveQuestionSet(
        userId: string,
        examId: string,
        count: number = 20,
    ): Promise<Question[]> {
        // Get user's mastery data
        const masteryData = await this.masteryRepo.find({
            where: { userId },
            order: { masteryScore: 'ASC' }, // Prioritize weak areas
        });

        // Get all questions for the exam (supporting both direct examId and ManyToMany relation)
        const allQuestions = await this.questionRepo.createQueryBuilder('question')
            .leftJoin('question.exams', 'exams')
            .where('question.examId = :examId', { examId })
            .orWhere('exams.id = :examId', { examId })
            .getMany();

        if (allQuestions.length === 0) {
            return [];
        }

        // Group questions by topic
        const questionsByTopic = new Map<string, Question[]>();
        for (const q of allQuestions) {
            const topic = q.topic || 'General';
            if (!questionsByTopic.has(topic)) {
                questionsByTopic.set(topic, []);
            }
            questionsByTopic.get(topic)!.push(q);
        }

        // Adaptive selection algorithm
        const selectedQuestions: Question[] = [];
        const topicWeights = new Map<string, number>();

        // Calculate weights (lower mastery = higher weight)
        for (const mastery of masteryData) {
            topicWeights.set(mastery.topic, 1 - mastery.masteryScore);
        }

        // Ensure all topics have a weight
        for (const topic of questionsByTopic.keys()) {
            if (!topicWeights.has(topic)) {
                topicWeights.set(topic, 0.5); // Default for new topics
            }
        }

        // Weighted random selection
        while (selectedQuestions.length < count && selectedQuestions.length < allQuestions.length) {
            const topic = this.selectTopicByWeight(Array.from(topicWeights.entries()));
            const topicQuestions = questionsByTopic.get(topic) || [];

            if (topicQuestions.length === 0) {
                topicWeights.delete(topic);
                continue;
            }

            // Select random question from topic
            const randomIndex = Math.floor(Math.random() * topicQuestions.length);
            const question = topicQuestions[randomIndex];

            // Avoid duplicates
            if (!selectedQuestions.find(q => q.id === question.id)) {
                selectedQuestions.push(question);
            }

            // Remove selected question
            topicQuestions.splice(randomIndex, 1);
        }

        return selectedQuestions;
    }

    private selectTopicByWeight(weights: [string, number][]): string {
        const totalWeight = weights.reduce((sum, [_, weight]) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (const [topic, weight] of weights) {
            random -= weight;
            if (random <= 0) {
                return topic;
            }
        }

        return weights[0][0]; // Fallback
    }

    async getWeakAreas(userId: string, limit: number = 5): Promise<UserTopicMastery[]> {
        return this.masteryRepo.find({
            where: { userId },
            order: { masteryScore: 'ASC' },
            take: limit,
        });
    }

    async getComparisonStats(userId: string) {
        // 1. Get user's mastery
        const userMastery = await this.masteryRepo.find({
            where: { userId },
        });

        // 2. Get global "Topper" mastery (Max score per topic)
        const topperStats = await this.masteryRepo.createQueryBuilder('mastery')
            .select('mastery.topic', 'topic')
            .addSelect('MAX(mastery.masteryScore)', 'topperScore')
            .groupBy('mastery.topic')
            .getRawMany();

        // 3. Merge and format for frontend (map to 0-100 scale)
        return userMastery.map(m => {
            const topper = topperStats.find(t => t.topic === m.topic);
            const tScore = topper ? parseFloat(topper.topperScore) : m.masteryScore;

            return {
                topic: m.topic,
                yourScore: Math.round(m.masteryScore * 100),
                topperScore: Math.round(Math.max(m.masteryScore, tScore) * 100)
            };
        });
    }

    async generateLearningPath(userId: string): Promise<LearningPath> {
        const weakAreas = await this.getWeakAreas(userId, 10);
        const strongAreas = await this.masteryRepo.find({
            where: { userId },
            order: { masteryScore: 'DESC' },
            take: 5,
        });

        const recommendations: TopicRecommendation[] = weakAreas.map((mastery, index) => ({
            topic: mastery.topic,
            priority: 10 - index,
            reason: `Low mastery (${(mastery.masteryScore * 100).toFixed(0)}%)`,
            estimatedTime: 30, // minutes
        }));

        // COLD START: If no data, recommend a diagnostic test
        if (recommendations.length === 0) {
            recommendations.push({
                topic: 'General Assessment',
                priority: 10,
                reason: 'Start here to analyze your strengths and weaknesses',
                estimatedTime: 60,
            });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 1 week

        const path = this.pathRepo.create({
            userId,
            recommendedTopics: recommendations,
            weakAreas: weakAreas.map(m => m.topic),
            strongAreas: strongAreas.map(m => m.topic),
            expiresAt,
        });

        return this.pathRepo.save(path);
    }

    async getQuestionsForTopic(topic: string, limit: number = 10) {
        let query = this.questionRepo.createQueryBuilder('q')
            .leftJoinAndSelect('q.subject', 's');

        if (topic !== 'General Assessment') {
            query = query.where('q.topic = :topic', { topic });
        }

        // Fetch excess to allow shuffle
        // Fetch excess to allow shuffle
        let questions = await query.take(50).getMany();

        // FALLBACK: If no questions found (e.g. topic mismatch or empty DB for topic), 
        // try fetching simple random questions to avoid "No Questions Found" error provided user is beginner.
        if (questions.length === 0) {
            this.logger.warn(`No questions found for topic '${topic}'. Falling back to random selection.`);
            questions = await this.questionRepo.createQueryBuilder('q')
                .leftJoinAndSelect('q.subject', 's')
                .orderBy('RANDOM()') // Postgres/SQLite specific usually, but works in many. If not, we take(50) and shuffle.
                .take(50)
                .getMany();
        }

        // Shuffle in memory
        return questions.sort(() => 0.5 - Math.random()).slice(0, limit);
    }

    async getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
        if (!questionIds || questionIds.length === 0) {
            this.logger.log('getQuestionsByIds: No IDs provided');
            return [];
        }

        this.logger.log(`Fetching ${questionIds.length} questions: ${questionIds.join(', ')}`);

        const questions = await this.questionRepo.createQueryBuilder('q')
            .leftJoinAndSelect('q.subject', 's')
            .where('q.id IN (:...ids)', { ids: questionIds })
            .getMany();

        this.logger.log(`Found ${questions.length} questions.`);
        return questions;
    }
}

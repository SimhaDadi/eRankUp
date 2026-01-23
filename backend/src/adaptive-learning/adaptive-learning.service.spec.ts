import { Test, TestingModule } from '@nestjs/testing';
import { AdaptiveLearningService } from './adaptive-learning.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserTopicMastery } from './entities/user-topic-mastery.entity';
import { LearningPath } from './entities/learning-path.entity';
import { Question } from '../exams/entities/question.entity';
import { Response } from '../exams/entities/response.entity';
import { Repository } from 'typeorm';

describe('AdaptiveLearningService', () => {
    let service: AdaptiveLearningService;
    let userTopicMasteryRepo: Repository<UserTopicMastery>;

    const mockUserTopicMasteryRepo = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockLearningPathRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockQuestionRepo = {
        find: jest.fn(),
    };

    const mockResponseRepo = {
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdaptiveLearningService,
                {
                    provide: getRepositoryToken(UserTopicMastery),
                    useValue: mockUserTopicMasteryRepo,
                },
                {
                    provide: getRepositoryToken(LearningPath),
                    useValue: mockLearningPathRepo,
                },
                {
                    provide: getRepositoryToken(Question),
                    useValue: mockQuestionRepo,
                },
                {
                    provide: getRepositoryToken(Response),
                    useValue: mockResponseRepo,
                },
            ],
        }).compile();

        service = module.get<AdaptiveLearningService>(AdaptiveLearningService);
        userTopicMasteryRepo = module.get(getRepositoryToken(UserTopicMastery));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateMasteryScore', () => {
        it('should calculate correct mastery score', async () => {
            const userId = 'test-user';
            const topic = 'Algebra';

            // Mock mastery data
            mockUserTopicMasteryRepo.findOne.mockResolvedValue({
                userId,
                topic,
                totalAttempts: 10,
                correctAttempts: 7,
                lastPracticedAt: new Date(),
            });

            mockResponseRepo.find.mockResolvedValue([]);

            const score = await service.calculateMasteryScore(userId, topic);

            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
        });

        it('should return 0 for no attempts', async () => {
            const userId = 'test-user';
            const topic = 'Math';

            mockUserTopicMasteryRepo.findOne.mockResolvedValue(null);

            const score = await service.calculateMasteryScore(userId, topic);
            expect(score).toBe(0);
        });
    });

    describe('updateTopicMastery', () => {
        it('should create new mastery record if none exists', async () => {
            const userId = 'test-user';
            const responses = [
                {
                    question: { topic: 'Algebra', subject: { id: 'math' } },
                    isCorrect: true,
                },
                {
                    question: { topic: 'Algebra', subject: { id: 'math' } },
                    isCorrect: false,
                },
            ];

            mockUserTopicMasteryRepo.findOne.mockResolvedValue(null);
            mockUserTopicMasteryRepo.create.mockReturnValue({
                userId,
                topic: 'Algebra',
                subjectId: 'math',
                totalAttempts: 2,
                correctAttempts: 1,
                masteryScore: 0.5,
            });
            mockUserTopicMasteryRepo.save.mockResolvedValue({});

            await service.updateTopicMastery(userId, responses as any);

            expect(mockUserTopicMasteryRepo.create).toHaveBeenCalled();
            expect(mockUserTopicMasteryRepo.save).toHaveBeenCalled();
        });

        it('should update existing mastery record', async () => {
            const userId = 'test-user';
            const responses = [
                {
                    question: { topic: 'Algebra', subject: { id: 'math' } },
                    isCorrect: true,
                },
            ];

            const existingMastery = {
                userId,
                topic: 'Algebra',
                subjectId: 'math',
                totalAttempts: 5,
                correctAttempts: 3,
                masteryScore: 0.6,
                lastPracticedAt: new Date(),
            };

            mockUserTopicMasteryRepo.findOne.mockResolvedValue(existingMastery);
            mockUserTopicMasteryRepo.save.mockResolvedValue({
                ...existingMastery,
                totalAttempts: 6,
                correctAttempts: 4,
            });

            // Mock internal method to avoid re-fetching stale data
            jest.spyOn(service, 'calculateMasteryScore').mockResolvedValue(0.6);

            await service.updateTopicMastery(userId, responses as any);

            expect(mockUserTopicMasteryRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalAttempts: 6,
                    correctAttempts: 4,
                })
            );
        });
    });

    describe('getWeakAreas', () => {
        it('should return topics sorted by lowest mastery score', async () => {
            const userId = 'test-user';
            const mockMasteryData = [
                { topic: 'Algebra', masteryScore: 0.3, totalAttempts: 10, correctAttempts: 3 },
                { topic: 'Probability', masteryScore: 0.5, totalAttempts: 10, correctAttempts: 5 },
            ];

            mockUserTopicMasteryRepo.find.mockResolvedValue(mockMasteryData);

            const weakAreas = await service.getWeakAreas(userId, 2);

            expect(weakAreas).toHaveLength(2);
            expect(weakAreas[0].topic).toBe('Algebra');
            expect(weakAreas[1].topic).toBe('Probability');
        });
    });

    describe('generateLearningPath', () => {
        it('should generate learning path with weak areas prioritized', async () => {
            const userId = 'test-user';
            const mockMasteryData = [
                { topic: 'Algebra', masteryScore: 0.3, totalAttempts: 10, correctAttempts: 3 },
                { topic: 'Geometry', masteryScore: 0.8, totalAttempts: 10, correctAttempts: 8 },
                { topic: 'Probability', masteryScore: 0.5, totalAttempts: 10, correctAttempts: 5 },
            ];

            mockUserTopicMasteryRepo.find.mockResolvedValue(mockMasteryData);
            mockLearningPathRepo.create.mockReturnValue({});
            mockLearningPathRepo.save.mockResolvedValue({
                recommendedTopics: [
                    { topic: 'Algebra', priority: 9, reason: 'Low mastery', estimatedTime: 60 },
                    { topic: 'Probability', priority: 6, reason: 'Medium mastery', estimatedTime: 45 },
                ],
                weakAreas: ['Algebra'],
                strongAreas: ['Geometry'],
            });

            const learningPath = await service.generateLearningPath(userId);

            expect(learningPath.recommendedTopics[0].topic).toBe('Algebra');
            expect(learningPath.recommendedTopics[0].priority).toBeGreaterThan(
                learningPath.recommendedTopics[1].priority
            );
            expect(learningPath.weakAreas).toContain('Algebra');
            expect(learningPath.strongAreas).toContain('Geometry');
        });
    });
});

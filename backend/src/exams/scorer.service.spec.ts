import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScorerService } from './scorer.service';
import { Attempt } from './entities/attempt.entity';
import { Question } from './entities/question.entity';
import { Model } from './entities/model.entity';
import { Response } from './entities/response.entity';
import { DifficultyService } from './difficulty.service';
import { CacheService } from '../common/cache.service';
import { User } from '../users/user.entity';
import { GamificationService } from '../gamification/gamification.service';
import { AdaptiveLearningService } from '../adaptive-learning/adaptive-learning.service';

describe('ScorerService', () => {
    let service: ScorerService;

    const mockAttemptRepository = {
        save: jest.fn().mockImplementation(a => Promise.resolve({ id: 'attempt-id', ...a })),
        findOne: jest.fn(),
        create: jest.fn().mockImplementation(d => d),
    };

    const mockQuestionRepository = {
        find: jest.fn(),
    };

    const mockModelRepository = {
        findOne: jest.fn(),
    };

    const mockResponseRepository = {
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn(),
    };

    const mockDifficultyService = {};
    const mockCacheService = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn().mockResolvedValue(null),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScorerService,
                { provide: getRepositoryToken(Attempt), useValue: mockAttemptRepository },
                { provide: getRepositoryToken(Question), useValue: mockQuestionRepository },
                { provide: getRepositoryToken(Model), useValue: mockModelRepository },
                { provide: getRepositoryToken(Response), useValue: mockResponseRepository },
                {
                    provide: DifficultyService,
                    useValue: {
                        bulkUpdateStats: jest.fn(),
                    }
                },
                { provide: CacheService, useValue: mockCacheService },
                {
                    provide: GamificationService,
                    useValue: {
                        awardXP: jest.fn(),
                        updateStreak: jest.fn(),
                        getOrCreateProfile: jest.fn().mockResolvedValue({ testsCompleted: 0, correctAnswers: 0 }),
                    }
                },
                {
                    provide: AdaptiveLearningService,
                    useValue: {
                        updateTopicMastery: jest.fn(),
                    }
                }
            ],
        }).compile();

        service = module.get<ScorerService>(ScorerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('gradeAndSave', () => {
        it('should correctly calculate score for a perfect attempt', async () => {
            const user = { id: 'user-1' } as User;
            const modelId = 'model-1';
            const questions = [
                { id: 'q1', correctOptionId: '1', positiveMarks: 2, negativeMarks: 0.5 },
                { id: 'q2', correctOptionId: '2', positiveMarks: 2, negativeMarks: 0.5 },
            ] as Question[];

            mockModelRepository.findOne.mockResolvedValue({ id: modelId, questions });
            mockQuestionRepository.find.mockResolvedValue(questions);

            const userAnswers = { 'q1': '1', 'q2': '2' };
            const result = await service.gradeAndSave(user, modelId, userAnswers, Date.now() - 1000);

            expect(result.score).toBe(100);
            expect(result.correctAnswers).toBe(2);
            expect(result.accuracy).toBe(100);
        });

        it('should correctly calculate score with negative marking', async () => {
            const user = { id: 'user-1' } as User;
            const questions = [
                { id: 'q1', correctOptionId: '1', positiveMarks: 2, negativeMarks: 0.5 },
                { id: 'q2', correctOptionId: '1', positiveMarks: 2, negativeMarks: 0.5 },
            ] as Question[];

            mockModelRepository.findOne.mockResolvedValue({ id: 'm1', questions });
            mockQuestionRepository.find.mockResolvedValue(questions);

            const userAnswers = { 'q1': '1', 'q2': 'wrong' };
            const result = await service.gradeAndSave(user, 'm1', userAnswers, Date.now() - 1000);

            // 2 (correct) - 0.5 (wrong) = 1.5
            // Total possible: 4
            // Percentage: (1.5 / 4) * 100 = 37.5
            expect(result.score).toBe(37.5);
            expect(result.correctAnswers).toBe(1);
            expect(result.accuracy).toBe(50);
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from './gamification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserGamification } from './entities/user-gamification.entity';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { UserChallengeProgress } from './entities/user-challenge-progress.entity';
import { Repository } from 'typeorm';

describe('GamificationService', () => {
    let service: GamificationService;
    let userGamificationRepo: Repository<UserGamification>;

    const mockUserGamificationRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        }),
    };

    const mockDailyChallengeRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockUserChallengeProgressRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GamificationService,
                {
                    provide: getRepositoryToken(UserGamification),
                    useValue: mockUserGamificationRepo,
                },
                {
                    provide: getRepositoryToken(DailyChallenge),
                    useValue: mockDailyChallengeRepo,
                },
                {
                    provide: getRepositoryToken(UserChallengeProgress),
                    useValue: mockUserChallengeProgressRepo,
                },
            ],
        }).compile();

        service = module.get<GamificationService>(GamificationService);
        userGamificationRepo = module.get(getRepositoryToken(UserGamification));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('awardXP', () => {
        it('should award XP and calculate correct level', async () => {
            const userId = 'test-user-id';
            const xpToAward = 200;

            const mockProfile = {
                id: '1',
                userId,
                totalXp: 100,
                level: 1,
                currentStreak: 0,
                longestStreak: 0,
                badges: [],
                lastActivityDate: new Date(),
            };

            mockUserGamificationRepo.findOne.mockResolvedValue(mockProfile);
            mockUserGamificationRepo.save.mockResolvedValue({
                ...mockProfile,
                totalXp: 300,
                level: 2,
            });

            const result = await service.awardXP(userId, xpToAward, 'Test reward');

            expect(result.newLevel).toBe(3);
            expect(result.leveledUp).toBe(true);
            expect(mockUserGamificationRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalXp: 300,
                    level: 3,
                })
            );
        });

        it('should not level up if XP threshold not reached', async () => {
            const userId = 'test-user-id';
            const xpToAward = 50;

            const mockProfile = {
                id: '1',
                userId,
                totalXp: 100,
                level: 2,
                currentStreak: 0,
                longestStreak: 0,
                badges: [],
                lastActivityDate: new Date(),
            };

            mockUserGamificationRepo.findOne.mockResolvedValue(mockProfile);
            mockUserGamificationRepo.save.mockResolvedValue({
                ...mockProfile,
                totalXp: 150,
                level: 2,
            });

            const result = await service.awardXP(userId, xpToAward, 'Test reward');

            expect(result.newLevel).toBeUndefined();
            expect(result.leveledUp).toBe(false);
        });
    });

    describe('updateStreak', () => {
        it('should increment streak if practiced today', async () => {
            const userId = 'test-user-id';
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const mockProfile = {
                id: '1',
                userId,
                totalXp: 100,
                level: 1,
                currentStreak: 1,
                longestStreak: 1,
                badges: [],
                lastActivityDate: yesterday,
            };

            mockUserGamificationRepo.findOne.mockResolvedValue(mockProfile);
            mockUserGamificationRepo.save.mockResolvedValue({
                ...mockProfile,
                currentStreak: 2,
                longestStreak: 2,
                lastActivityDate: new Date(),
            });

            await service.updateStreak(userId);

            expect(mockUserGamificationRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    currentStreak: 2,
                    longestStreak: 2,
                })
            );
        });

        it('should reset streak if missed a day', async () => {
            const userId = 'test-user-id';
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const mockProfile = {
                id: '1',
                userId,
                totalXp: 100,
                level: 1,
                currentStreak: 5,
                longestStreak: 5,
                badges: [],
                lastActivityDate: threeDaysAgo,
            };

            mockUserGamificationRepo.findOne.mockResolvedValue(mockProfile);
            mockUserGamificationRepo.save.mockResolvedValue({
                ...mockProfile,
                currentStreak: 1,
                lastActivityDate: new Date(),
            });

            await service.updateStreak(userId);

            expect(mockUserGamificationRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    currentStreak: 1,
                })
            );
        });
    });

    describe('checkBadges', () => {
        it('should award "First Steps" badge after first test', async () => {
            const mockProfile = {
                id: '1',
                userId: 'test-user',
                totalXp: 50,
                level: 1,
                currentStreak: 1,
                longestStreak: 1,
                badges: [],
                lastActivityDate: new Date(),
                testsCompleted: 1,
                correctAnswers: 10,
            };

            mockUserGamificationRepo.findOne.mockResolvedValue(mockProfile);
            const newBadges = await service.checkBadges(mockProfile.userId);

            expect(newBadges).toContainEqual(
                expect.objectContaining({
                    id: 'first_steps',
                    name: 'First Steps',
                })
            );
        });

        it('should not award duplicate badges', async () => {
            const mockProfile = {
                id: '1',
                userId: 'test-user',
                totalXp: 50,
                level: 1,
                currentStreak: 1,
                longestStreak: 1,
                badges: [{ id: 'first_steps', name: 'First Steps', earnedAt: new Date() }],
                lastActivityDate: new Date(),
                testsCompleted: 1,
                correctAnswers: 10,
            };

            const newBadges = await service.checkBadges(mockProfile as any);

            expect(newBadges).toHaveLength(0);
        });
    });

    describe('getLeaderboard', () => {
        it('should return top 100 users sorted by XP', async () => {
            const mockLeaderboard = [
                { userId: 'user1', fullName: 'User 1', totalXp: 1000, level: 10, rank: 1 },
                { userId: 'user2', fullName: 'User 2', totalXp: 800, level: 8, rank: 2 },
                { userId: 'user3', fullName: 'User 3', totalXp: 600, level: 6, rank: 3 },
            ];

            (mockUserGamificationRepo.createQueryBuilder() as any).getMany.mockResolvedValue(mockLeaderboard);

            const result = await service.getLeaderboard();

            expect(result).toHaveLength(3);
            expect(result[0].totalXp).toBeGreaterThan(result[1].totalXp);
            expect(result[1].totalXp).toBeGreaterThan(result[2].totalXp);
        });
    });
});

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGamification, Badge } from './entities/user-gamification.entity';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { UserChallengeProgress } from './entities/user-challenge-progress.entity';
import { BADGES, LEVEL_THRESHOLDS, XP_REWARDS, BadgeDefinition } from './config/badges.config';

export interface LevelUpResult {
    leveledUp: boolean;
    newLevel?: number;
    newBadges?: Badge[];
}

export interface StreakResult {
    currentStreak: number;
    isNewRecord: boolean;
    xpAwarded: number;
}

export interface LeaderboardEntry {
    userId: string;
    fullName: string;
    totalXp: number;
    level: number;
    rank: number;
}

@Injectable()
export class GamificationService {
    constructor(
        @InjectRepository(UserGamification)
        private gamificationRepo: Repository<UserGamification>,
        @InjectRepository(DailyChallenge)
        private challengeRepo: Repository<DailyChallenge>,
        @InjectRepository(UserChallengeProgress)
        private progressRepo: Repository<UserChallengeProgress>,
    ) { }

    async getOrCreateProfile(userId: string): Promise<UserGamification> {
        let profile = await this.gamificationRepo.findOne({ where: { userId } });

        if (!profile) {
            profile = this.gamificationRepo.create({
                userId,
                totalXp: 0,
                level: 1,
                currentStreak: 0,
                longestStreak: 0,
                badges: [],
            });
            await this.gamificationRepo.save(profile);
        }

        return profile;
    }

    async awardXP(userId: string, amount: number, reason: string): Promise<LevelUpResult> {
        const profile = await this.getOrCreateProfile(userId);

        const oldLevel = profile.level;
        profile.totalXp += amount;

        // Calculate new level
        const newLevel = this.calculateLevel(profile.totalXp);
        profile.level = newLevel;

        await this.gamificationRepo.save(profile);

        // Check for new badges
        const newBadges = await this.checkBadges(userId);

        return {
            leveledUp: newLevel > oldLevel,
            newLevel: newLevel > oldLevel ? newLevel : undefined,
            newBadges: newBadges.length > 0 ? newBadges : undefined,
        };
    }

    calculateLevel(totalXp: number): number {
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (totalXp >= LEVEL_THRESHOLDS[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    async updateStreak(userId: string): Promise<StreakResult> {
        const profile = await this.getOrCreateProfile(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastActivity = profile.lastActivityDate ? new Date(profile.lastActivityDate) : null;

        if (lastActivity) {
            lastActivity.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                // Same day, no streak update
                return {
                    currentStreak: profile.currentStreak,
                    isNewRecord: false,
                    xpAwarded: 0,
                };
            } else if (daysDiff === 1) {
                // Consecutive day
                profile.currentStreak++;
            } else {
                // Streak broken
                profile.currentStreak = 1;
            }
        } else {
            // First activity
            profile.currentStreak = 1;
        }

        profile.lastActivityDate = today;

        // Update longest streak
        const isNewRecord = profile.currentStreak > profile.longestStreak;
        if (isNewRecord) {
            profile.longestStreak = profile.currentStreak;
        }

        // Award streak XP
        let xpAwarded = 0;
        if (profile.currentStreak >= 7) {
            xpAwarded = XP_REWARDS.WEEKLY_STREAK;
        } else if (profile.currentStreak >= 1) {
            xpAwarded = XP_REWARDS.DAILY_STREAK;
        }

        if (xpAwarded > 0) {
            profile.totalXp += xpAwarded;
            profile.level = this.calculateLevel(profile.totalXp);
        }

        await this.gamificationRepo.save(profile);

        return {
            currentStreak: profile.currentStreak,
            isNewRecord,
            xpAwarded,
        };
    }

    async checkBadges(userId: string): Promise<Badge[]> {
        const profile = await this.gamificationRepo.findOne({ where: { userId } });
        if (!profile) return [];

        const earnedBadgeIds = new Set(profile.badges.map(b => b.id));
        const newBadges: Badge[] = [];

        // Get user stats (you'll need to query from Attempt entity)
        // For now, checking level and XP-based badges

        for (const [key, badgeDef] of Object.entries(BADGES)) {
            if (earnedBadgeIds.has(badgeDef.id)) continue;

            if (this.checkBadgeCriteria(badgeDef, profile)) {
                const badge: Badge = {
                    id: badgeDef.id,
                    name: badgeDef.name,
                    earnedAt: new Date(),
                };
                newBadges.push(badge);
                profile.badges.push(badge);
            }
        }

        if (newBadges.length > 0) {
            await this.gamificationRepo.save(profile);
        }

        return newBadges;
    }

    private checkBadgeCriteria(badge: BadgeDefinition, profile: UserGamification): boolean {
        if (badge.criteria.level && profile.level >= badge.criteria.level) {
            return true;
        }
        if (badge.criteria.totalXp && profile.totalXp >= badge.criteria.totalXp) {
            return true;
        }
        if (badge.criteria.streak && profile.currentStreak >= badge.criteria.streak) {
            return true;
        }

        // Additional criteria
        if ((badge.criteria as any).testsCompleted && (profile as any).testsCompleted >= (badge.criteria as any).testsCompleted) {
            return true;
        }
        if ((badge.criteria as any).correctAnswers && (profile as any).correctAnswers >= (badge.criteria as any).correctAnswers) {
            return true;
        }

        return false;
    }

    async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
        const profiles = await this.gamificationRepo
            .createQueryBuilder('g')
            .leftJoinAndSelect('g.user', 'user')
            .orderBy('g.totalXp', 'DESC')
            .limit(limit)
            .getMany();

        return profiles.map((profile, index) => ({
            userId: profile.userId,
            fullName: profile.user?.fullName || 'Anonymous',
            totalXp: profile.totalXp,
            level: profile.level,
            rank: index + 1,
        }));
    }

    async getDailyChallenge(date: Date = new Date()): Promise<DailyChallenge> {
        const dateStr = date.toISOString().split('T')[0];

        let challenge = await this.challengeRepo.findOne({
            where: { date: new Date(dateStr) },
        });

        if (!challenge) {
            // Generate daily challenge
            challenge = await this.generateDailyChallenge(new Date(dateStr));
        }

        return challenge;
    }

    private async generateDailyChallenge(date: Date): Promise<DailyChallenge> {
        const challenges = [
            { type: 'accuracy', target: 80, description: 'Score 80% or higher in any test', xp: 50 },
            { type: 'speed', target: 20, description: 'Complete 20 questions today', xp: 50 },
            { type: 'perfect', target: 1, description: 'Get a perfect score in any test', xp: 100 },
        ];

        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

        const challenge = this.challengeRepo.create({
            date,
            challengeType: randomChallenge.type,
            targetValue: randomChallenge.target,
            rewardXp: randomChallenge.xp,
            description: randomChallenge.description,
        });

        return await this.challengeRepo.save(challenge);
    }

    async getUserChallengeProgress(userId: string, challengeId: string): Promise<UserChallengeProgress> {
        let progress = await this.progressRepo.findOne({
            where: { userId, challengeId },
        });

        if (!progress) {
            progress = this.progressRepo.create({
                userId,
                challengeId,
                currentValue: 0,
                completed: false,
            });
            await this.progressRepo.save(progress);
        }

        return progress;
    }

    async updateChallengeProgress(
        userId: string,
        challengeId: string,
        value: number,
    ): Promise<void> {
        const progress = await this.getUserChallengeProgress(userId, challengeId);
        const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });

        if (!challenge || progress.completed) return;

        progress.currentValue = value;

        if (value >= challenge.targetValue) {
            progress.completed = true;
            progress.completedAt = new Date();

            // Award XP
            await this.awardXP(userId, challenge.rewardXp, 'Daily challenge completed');
        }

        await this.progressRepo.save(progress);
    }
    async updateDailyTarget(userId: string, target: number): Promise<UserGamification> {
        // Validation: Target must be at least 10 questions
        if (target < 10) {
            throw new Error('Daily target must be at least 10 questions');
        }

        const profile = await this.getOrCreateProfile(userId);
        profile.dailyQuestionTarget = target;
        return await this.gamificationRepo.save(profile);
    }
}

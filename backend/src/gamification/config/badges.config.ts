export interface BadgeDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria: BadgeCriteria;
}

export interface BadgeCriteria {
    testsCompleted?: number;
    correctAnswers?: number;
    streak?: number;
    perfectScores?: number;
    totalXp?: number;
    level?: number;
}

export const BADGES: Record<string, BadgeDefinition> = {
    FIRST_STEPS: {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first practice test',
        icon: '🎯',
        criteria: { testsCompleted: 1 }
    },
    QUICK_LEARNER: {
        id: 'quick_learner',
        name: 'Quick Learner',
        description: 'Solve 10 questions correctly',
        icon: '⚡',
        criteria: { correctAnswers: 10 }
    },
    HALF_CENTURY: {
        id: 'half_century',
        name: 'Half Century',
        description: 'Solve 50 questions correctly',
        icon: '🎖️',
        criteria: { correctAnswers: 50 }
    },
    CENTURY: {
        id: 'century',
        name: 'Century',
        description: 'Solve 100 questions correctly',
        icon: '💯',
        criteria: { correctAnswers: 100 }
    },
    DOUBLE_CENTURY: {
        id: 'double_century',
        name: 'Double Century',
        description: 'Solve 200 questions correctly',
        icon: '🏆',
        criteria: { correctAnswers: 200 }
    },
    STREAK_3: {
        id: 'streak_3',
        name: '3-Day Streak',
        description: 'Practice for 3 consecutive days',
        icon: '🔥',
        criteria: { streak: 3 }
    },
    WEEK_WARRIOR: {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Maintain 7-day streak',
        icon: '🔥🔥',
        criteria: { streak: 7 }
    },
    MONTH_MASTER: {
        id: 'month_master',
        name: 'Month Master',
        description: 'Maintain 30-day streak',
        icon: '🔥🔥🔥',
        criteria: { streak: 30 }
    },
    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Score 100% in any test',
        icon: '⭐',
        criteria: { perfectScores: 1 }
    },
    PERFECT_TRIO: {
        id: 'perfect_trio',
        name: 'Perfect Trio',
        description: 'Score 100% in 3 tests',
        icon: '⭐⭐⭐',
        criteria: { perfectScores: 3 }
    },
    LEVEL_5: {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach Level 5',
        icon: '🌟',
        criteria: { level: 5 }
    },
    LEVEL_10: {
        id: 'level_10',
        name: 'Dedicated Learner',
        icon: '✨',
        description: 'Reach Level 10',
        criteria: { level: 10 }
    },
    LEVEL_25: {
        id: 'level_25',
        name: 'Expert',
        description: 'Reach Level 25',
        icon: '💫',
        criteria: { level: 25 }
    },
    LEVEL_50: {
        id: 'level_50',
        name: 'Legend',
        description: 'Reach Level 50',
        icon: '👑',
        criteria: { level: 50 }
    },
    XP_1000: {
        id: 'xp_1000',
        name: 'Thousand Club',
        description: 'Earn 1000 XP',
        icon: '🎊',
        criteria: { totalXp: 1000 }
    },
    XP_5000: {
        id: 'xp_5000',
        name: 'Five Thousand Club',
        description: 'Earn 5000 XP',
        icon: '🎉',
        criteria: { totalXp: 5000 }
    },
    XP_10000: {
        id: 'xp_10000',
        name: 'Ten Thousand Club',
        description: 'Earn 10000 XP',
        icon: '🏅',
        criteria: { totalXp: 10000 }
    },
};

export const XP_REWARDS = {
    QUESTION_CORRECT: 10,
    QUESTION_CORRECT_FIRST_TRY: 15,
    COMPLETE_TEST: 50,
    PERFECT_SCORE: 100,
    DAILY_STREAK: 20,
    WEEKLY_STREAK: 100,
    CHALLENGE_COMPLETE: 50,
};

export const LEVEL_THRESHOLDS = [
    0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, // 1-10
    5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000, // 11-20
    21000, 23100, 25300, 27600, 30000, 32500, 35100, 37800, 40600, 43500, // 21-30
    46500, 49600, 52800, 56100, 59500, 63000, 66600, 70300, 74100, 78000, // 31-40
    82000, 86100, 90300, 94600, 99000, 103500, 108100, 112800, 117600, 122500, // 41-50
];

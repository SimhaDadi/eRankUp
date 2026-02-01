export interface Stats {
    totalAttempts: number;
    averageScore: number;
    totalTimeTaken: number;
    accuracy: number;
    streak: number;
    dailyQuestions?: number;
    totalXp?: number;
    level?: number;
    badges?: any[];
    dailyQuestionTarget?: number;
}

export interface RecentAttempt {
    id: string;
    score: number;
    createdAt: string;
    model: {
        title: string;
        chapter?: {
            title: string;
        };
    };
    exam?: {
        title: string;
    };
}

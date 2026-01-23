export interface Stats {
    totalAttempts: number;
    averageScore: number;
    totalTimeTaken: number;
    accuracy: number;
    streak: number;
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

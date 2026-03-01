export interface ExplanationItem {
    id: string;
    questionId: string;
    questionContent: string;
    subject: string;
    chapter: string;
    aiExplanation: string | null;
    adminApprovedExplanation: string | null;
    isVerified: boolean;
    isLogicalMismatch: boolean;
    logicalSolveOutcome: string | null;
    status: 'pending' | 'generated' | 'verified';
    helpfulCount: number;
    notHelpfulCount: number;
    averageRating: number;
    viewCount: number;
    createdAt: string;
    options?: { id: string; text: string }[];
    correctOptionId?: string;
    isMissingAnswerKey?: boolean;
    aiProposedAnswerId?: string;
    isFallback?: boolean;
}

export interface PaginatedExplanations {
    items: ExplanationItem[];
    total: number;
    limit: number;
    offset: number;
}

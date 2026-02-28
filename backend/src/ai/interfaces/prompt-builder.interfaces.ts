// Type definitions for Prompt Builder Service
// Extracted to improve type safety and eliminate 'any' types

/**
 * Represents a student's weak area with topic and mastery level
 */
export interface WeakArea {
    topic: string;
    mastery: number; // 0.0 to 1.0
}

/**
 * Represents a student's performance on a specific question
 */
export interface UserPerformance {
    selectedOption: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
}

/**
 * Context about the current question being discussed
 */
export interface QuestionContext {
    content: string;
    options: string;
    correctOption: string;
    officialExplanation: string;
    imageUrl?: string;
    topic?: string;
    userPerformance?: UserPerformance;
    avgTopperTime?: number;
}

/**
 * Temperament context based on time of day
 */
export interface TemperamentContext {
    isLateNight: boolean;
    isEarlyMorning: boolean;
    currentTime: string;
}

/**
 * Context for building personalized chat prompts
 */
export interface ChatContext {
    weakAreas: WeakArea[];
    questionContext?: QuestionContext;
    preferredLanguage: string;
    historicalInsights: string[];
    currentTopicMastery: number;
    temperament: TemperamentContext;
}

/**
 * Options for building chat prompts
 */
export interface ChatPromptOptions {
    message: string;
    context: ChatContext;
    history: any[]; // AIChatMessage[] - using any to avoid circular dependency
}

/**
 * Options for building explanation prompts
 */
export interface ExplanationPromptOptions {
    question: any; // Question entity - keeping as any to avoid circular dependency
    userAnswer?: string;
    contextExamTitle?: string;
    subject?: string;
    verifiedSolve?: {
        solvedOptionId: string;
        logic: string;
        fullReasoning?: string;
    };
}

/**
 * Result of loading a question image
 */
export interface QuestionImage {
    data: string; // Base64 encoded
    mimeType: string;
}

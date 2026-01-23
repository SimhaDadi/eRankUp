export interface Question {
    id: string;
    text: string;
    options: any[]; // refine later
    correctOptionId?: string; // usually hidden from frontend until result
}

export interface Exam {
    id: string;
    title: string;
    description?: string;
    duration: number; // in minutes
    totalQuestions: number;
    thumbnail?: string;
    isPremium?: boolean;
    price?: number;
    subjects?: Subject[];
}

export interface Subject {
    id: string;
    title: string;
    chapters: Chapter[];
}

export interface Chapter {
    id: string;
    title: string;
    models: Model[];
}

export interface Model {
    id: string;
    title: string;
    totalQuestions: number;
}

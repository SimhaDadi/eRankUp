export interface Exam {
    id: string;
    title: string;
    type: 'real_exam' | 'question_bank';
}

export interface Subject {
    id: string;
    title: string;
}

export interface Chapter {
    id: string;
    title: string;
}

export interface Question {
    id: string;
    content: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    topic: string;
    difficultyWeight: number;
    subject?: { id: string; title: string };
    chapter?: { id: string; title: string };
    exams: Exam[];
    explanation?: string;
    imageUrl?: string;
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Chapter } from './chapter.entity';
import { Question } from './question.entity';
import { Exam } from './exam.entity';

@Entity()
export class Model {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ default: 0 })
    totalQuestions: number;

    @Column({ default: 60 }) // Duration in minutes
    duration: number;

    // Marking Scheme (inherits from Exam if null)
    @Column('float', { nullable: true })
    positiveMarks?: number;

    @Column('float', { nullable: true })
    negativeMarks?: number;

    // Difficulty Level
    @Column({
        type: 'enum',
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    })
    difficulty: string;

    // Permissions & Features
    @Column({ default: false })
    allowCalculator: boolean;

    @Column({ default: true })
    allowReview: boolean;

    @Column({ default: true })
    allowSkip: boolean;

    @Column({ default: false })
    showResultsImmediately: boolean;

    // Custom Instructions (exam-specific)
    @Column('text', { nullable: true })
    customInstructions?: string;

    // Warning time in minutes before exam ends
    @Column({ default: 5 })
    warningTimeMinutes: number;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @ManyToOne(() => Chapter, (chapter) => chapter.models)
    chapter: Chapter;

    @ManyToMany(() => Question, (question) => question.models)
    @JoinTable({ name: 'model_questions' })
    questions: Question[];

    @ManyToMany(() => Exam, (exam) => exam.models)
    exams: Exam[];
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToMany, JoinTable, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Expose, Exclude } from 'class-transformer';
import { Model } from './model.entity';
import { Subject } from './subject.entity';
import { Question } from './question.entity';

export enum ExamType {
    REAL_EXAM = 'real_exam',
    QUESTION_BANK = 'question_bank',
    PREVIOUS_YEAR_PAPER = 'previous_year_paper',
    LIVE_EXAM = 'live_exam',
    CHAPTER_WISE_TEST = 'chapter_wise_test'
}

@Entity()
export class Exam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({
        type: 'enum',
        enum: ExamType,
        default: ExamType.REAL_EXAM
    })
    type: ExamType;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    videoSolutionUrl: string;

    @Column({ nullable: true })
    category: string;

    @Index()
    @Column({ default: true })
    isActive: boolean;

    @Index()
    @Column({ default: false })
    isPremium: boolean;

    @Index()
    @Column({ default: false })
    isPublished: boolean;

    @Column('float', { default: 0 })
    price: number;

    @Column('float', { default: 1.0 })
    defaultPositiveMarks: number;

    @Column('float', { default: 0.25 })
    defaultNegativeMarks: number;

    @Column({ default: 60 }) // Default duration in minutes for models in this exam
    duration: number;

    @Column({ default: false })
    isLive: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    startTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    endTime: Date;

    @OneToMany(() => Subject, (subject) => subject.exam)
    subjects: Subject[];

    @ManyToMany(() => Question, (question) => question.exams)
    @JoinTable({ name: 'exam_questions_question' })
    questions: Question[];

    @ManyToMany(() => Model, (model) => model.exams)
    @JoinTable({ name: 'exam_models' })
    @Exclude()
    models: Model[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    directQuestionCount?: number;

    @Expose()
    chapters?: any[];

    @Expose()
    hasPurchased?: boolean;
}

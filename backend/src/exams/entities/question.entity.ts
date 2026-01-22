import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, Index } from 'typeorm';
import { Model } from './model.entity';
import { Subject } from './subject.entity';
import { Chapter } from './chapter.entity';
import { Exam } from './exam.entity';

@Entity()
export class Question {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @Column('simple-json', { nullable: true })
    options: { id: string; text: string }[];

    @Column()
    correctOptionId: string;

    @Column('text', { nullable: true })
    explanation: string;

    @Column({ default: 'General' })
    topic: string;

    @ManyToOne(() => Subject, { nullable: true })
    subject: Subject;

    @ManyToOne(() => Chapter, { nullable: true })
    chapter: Chapter;

    @Index()
    @Column({ nullable: true })
    chapterId: string;

    @ManyToOne(() => Exam, { nullable: true })
    exam: Exam;

    @Index()
    @Column({ nullable: true })
    examId: string;

    @ManyToMany(() => Exam, (exam) => exam.questions)
    exams: Exam[];

    @Index()
    @Column('float', { default: 0.5 })
    difficultyWeight: number;

    @Column('float', { default: 1.0 })
    positiveMarks: number;

    @Column('float', { default: 0.25 })
    negativeMarks: number;

    @Column({ default: 0 })
    correctCount: number;

    @Column({ default: 0 })
    totalAttempts: number;

    @ManyToMany(() => Model, (model) => model.questions)
    models: Model[];
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
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

    @Column('text', { nullable: true })
    imageUrl: string;

    @Column('simple-json', { nullable: true })
    options: { id: string; text: string }[];

    @Expose({ groups: ['admin', 'review'] })
    @Column()
    correctOptionId: string;

    @Expose({ groups: ['admin', 'review'] })
    @Column('text', { nullable: true })
    explanation: string;

    @Column({ default: 'General' })
    topic: string;

    @ManyToOne(() => Subject, { nullable: true })
    subject: Subject;

    @Index()
    @ManyToOne(() => Chapter, { nullable: true })
    chapter: Chapter;

    @Index()
    @Column({ nullable: true })
    chapterId: string;

    @Index()
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

    @Expose({ groups: ['admin', 'review'] })
    @Column('float', { default: 0.25 })
    negativeMarks: number;

    @Expose({ groups: ['admin', 'review'] })
    @Column({ default: 0 })
    correctCount: number;

    @Expose({ groups: ['admin', 'review'] })
    @Column({ default: 0 })
    totalAttempts: number;

    @Expose({ groups: ['admin', 'review'] })
    @Column('float', { default: 0 })
    avgTopperTime: number; // Average time taken by students who got it right

    @ManyToMany(() => Model, (model) => model.questions)
    models: Model[];

    @Column('vector', { length: 768, nullable: true })
    @Exclude({ toPlainOnly: true })
    embedding: number[];
}

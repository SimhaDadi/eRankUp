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

    @Exclude()
    @Expose({ groups: ['admin', 'review'] })
    @Column()
    correctOptionId: string;

    @Exclude()
    @Expose({ groups: ['admin', 'review'] })
    @Column('text', { nullable: true })
    explanation: string;

    @Column({ default: 'General' })
    topic: string;

    @ManyToOne(() => Subject, { nullable: true })
    subject: Subject;

    @ManyToOne(() => Chapter, { nullable: true })
    chapter: Chapter;

    @Column({ nullable: true })
    chapterId: string;

    @ManyToOne(() => Exam, { nullable: true })
    exam: Exam;

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

    @Column('float', { default: 0 })
    avgTopperTime: number; // Average time taken by students who got it right

    @ManyToMany(() => Model, (model) => model.questions)
    models: Model[];
}

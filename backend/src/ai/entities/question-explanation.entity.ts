import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { Question } from '../../exams/entities/question.entity';
import { Exam } from '../../exams/entities/exam.entity';

@Entity()
export class QuestionExplanation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Question, { onDelete: 'CASCADE' })
    @Index()
    question: Question;

    @Column()
    @Index()
    questionId: string;

    @ManyToOne(() => Exam, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'contextExamId' })
    contextExam: Exam;

    @Column({ nullable: true })
    @Index()
    contextExamId: string;

    @Column('text')
    aiExplanation: string;

    @Column('text', { nullable: true })
    adminApprovedExplanation: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ default: 0 })
    helpfulCount: number;

    @Column({ default: 0 })
    notHelpfulCount: number;

    @Column({ type: 'float', default: 0 })
    averageRating: number;

    @Column({ default: 0 })
    viewCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

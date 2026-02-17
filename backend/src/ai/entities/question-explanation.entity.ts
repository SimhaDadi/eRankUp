import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, JoinColumn, Unique } from 'typeorm';
import type { Question } from '../../exams/entities/question.entity';
import { Exam } from '../../exams/entities/exam.entity';

@Entity('question_explanation')
@Unique(['questionId', 'contextExamId'])
export class QuestionExplanation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne('Question', { onDelete: 'CASCADE' })
    @Index('IDX_QE_QUESTION')
    question: Question;

    @Column()
    @Index('IDX_QE_QUESTION_ID')
    questionId: string;

    @ManyToOne(() => Exam, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'contextExamId' })
    contextExam: Exam;

    @Column({ nullable: true })
    @Index('IDX_QE_CONTEXT_EXAM_ID')
    contextExamId: string;

    @Column('text')
    aiExplanation: string;

    @Column('text', { nullable: true })
    adminApprovedExplanation: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ default: false })
    isLogicalMismatch: boolean;

    @Column({ type: 'text', nullable: true })
    logicalSolveOutcome: string;

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

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Question } from '../../exams/entities/question.entity';

@Entity()
export class QuestionExplanation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Question, { onDelete: 'CASCADE' })
    @Index()
    question: Question;

    @Column()
    questionId: string;

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

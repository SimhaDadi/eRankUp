import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Type, Expose, Exclude } from 'class-transformer';
import { Attempt } from './attempt.entity';
import { Question } from './question.entity';

@Entity()
@Index(['attempt', 'isCorrect']) // Fast count: "How many correct in this attempt?"
export class Response {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Attempt, (attempt) => attempt.responses)
    @Exclude()
    attempt: Attempt;

    @Expose()
    @Index()
    @ManyToOne(() => Question)
    @Type(() => Question)
    question: Question;

    @Column()
    selectedOptionId: string;

    @Column()
    isCorrect: boolean;

    @Column('int', { nullable: true })
    timeSpent: number; // Time spent on this question in seconds

    @Column('float', { nullable: true, default: null })
    confidence: number; // User's confidence level (0-1 scale), optional feature

    @Column({ default: false })
    wasSkipped: boolean; // Track if question was skipped initially

    @Column({ default: false })
    wasReviewed: boolean; // Track if user reviewed this question

    @CreateDateColumn()
    answeredAt: Date;
}

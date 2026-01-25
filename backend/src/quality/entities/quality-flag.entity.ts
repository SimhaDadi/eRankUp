import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Question } from '../../exams/entities/question.entity';

export enum FlagStatus {
    PENDING = 'PENDING',
    REVIEWED = 'REVIEWED',
    RESOLVED = 'RESOLVED',
    DISMISSED = 'DISMISSED'
}

export enum FlagType {
    INCORRECT_ANSWER = 'INCORRECT_ANSWER',
    TYPO = 'TYPO',
    UNCLEAR_QUESTION = 'UNCLEAR_QUESTION',
    OFFENSIVE_CONTENT = 'OFFENSIVE_CONTENT',
    OTHER = 'OTHER'
}

@Entity('quality_flag')
export class QualityFlag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Question, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn()
    question: Question;

    @Column({ nullable: true })
    questionId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn()
    reporter: User;

    @Column({ nullable: true })
    reporterId: string;

    @Column({
        type: 'enum',
        enum: FlagType,
        default: FlagType.OTHER
    })
    type: FlagType;

    @Column('text')
    description: string;

    @Column({
        type: 'enum',
        enum: FlagStatus,
        default: FlagStatus.PENDING
    })
    status: FlagStatus;

    @Column({ type: 'text', nullable: true })
    adminNotes: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn()
    reviewedBy: User;

    @Column({ nullable: true })
    reviewedById: string;

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user.entity';

@Entity('user_stats')
export class UserStats {
    @PrimaryColumn()
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ default: 0 })
    totalAttempts: number;

    @Column('float', { default: 0 })
    totalScore: number;

    @Column({ default: 0 })
    totalQuestionsAttempted: number;

    @Column({ default: 0 })
    totalCorrect: number;

    @Column({ default: 0 })
    totalTimeTaken: number; // in seconds

    @Column({ default: 0 })
    currentStreak: number;

    @Column({ nullable: true })
    lastAttemptDate: Date;

    @Column('simple-json', { default: '{}' })
    topicPerformance: Record<string, { correct: number; total: number }>;

    @UpdateDateColumn()
    updatedAt: Date;
}

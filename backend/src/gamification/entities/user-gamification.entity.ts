import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';

export interface Badge {
    id: string;
    name: string;
    earnedAt: Date;
}

@Entity()
export class UserGamification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'int', default: 0 })
    totalXp: number;

    @Column({ type: 'int', default: 1 })
    level: number;

    @Column({ type: 'int', default: 0 })
    currentStreak: number;

    @Column({ type: 'int', default: 0 })
    longestStreak: number;

    @Column({ type: 'date', nullable: true })
    lastActivityDate: Date;

    @Column({ type: 'jsonb', default: [] })
    badges: Badge[];

    @Column({ type: 'int', default: 0 })
    testsCompleted: number;

    @Column({ type: 'int', default: 0 })
    correctAnswers: number;

    @Column({ name: 'dailyQuestionTarget', type: 'int', default: 100 })
    dailyQuestionTarget: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

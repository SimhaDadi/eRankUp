import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { DailyChallenge } from './daily-challenge.entity';

@Entity()
export class UserChallengeProgress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid' })
    challengeId: string;

    @ManyToOne(() => DailyChallenge)
    @JoinColumn({ name: 'challengeId' })
    challenge: DailyChallenge;

    @Column({ type: 'int', default: 0 })
    currentValue: number;

    @Column({ type: 'boolean', default: false })
    completed: boolean;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;
}

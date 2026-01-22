import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class DailyChallenge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', unique: true })
    date: Date;

    @Column({ type: 'varchar', length: 50 })
    challengeType: string;

    @Column({ type: 'int' })
    targetValue: number;

    @Column({ type: 'int' })
    rewardXp: number;

    @Column({ type: 'text' })
    description: string;

    @CreateDateColumn()
    createdAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
@Index(['userId', 'date'], { unique: true })
export class AIUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column({ type: 'date' })
    date: string; // Format: YYYY-MM-DD

    @Column({ default: 0 })
    requestCount: number;

    @Column({ default: 0 })
    totalTokens: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

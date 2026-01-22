import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

export interface TopicRecommendation {
    topic: string;
    priority: number;
    reason: string;
    estimatedTime: number;
}

@Entity()
export class LearningPath {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'jsonb', default: [] })
    recommendedTopics: TopicRecommendation[];

    @Column({ type: 'jsonb', default: [] })
    weakAreas: string[];

    @Column({ type: 'jsonb', default: [] })
    strongAreas: string[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    generatedAt: Date;

    @Column({ type: 'timestamp' })
    expiresAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Subject } from '../../exams/entities/subject.entity';

@Entity()
export class UserTopicMastery {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'varchar', length: 255 })
    topic: string;

    @Column({ type: 'uuid', nullable: true })
    subjectId: string;

    @ManyToOne(() => Subject, { nullable: true })
    @JoinColumn({ name: 'subjectId' })
    subject: Subject;

    @Column({ type: 'float', default: 0 })
    masteryScore: number;

    @Column({ type: 'int', default: 0 })
    totalAttempts: number;

    @Column({ type: 'int', default: 0 })
    correctAttempts: number;

    @Column({ type: 'timestamp', nullable: true })
    lastPracticedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

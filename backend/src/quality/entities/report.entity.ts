import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Question } from '../../exams/entities/question.entity';

export enum ReportStatus {
    PENDING = 'pending',
    RESOLVED = 'resolved',
    REJECTED = 'rejected'
}

@Entity()
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Question)
    question: Question;

    @Column()
    questionId: string;

    @Column('text')
    reason: string;

    @Column({
        type: 'enum',
        enum: ReportStatus,
        default: ReportStatus.PENDING
    })
    status: ReportStatus;

    @Column({ nullable: true })
    adminNotes: string;

    @CreateDateColumn()
    createdAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Question } from '../../exams/entities/question.entity';
import { User } from '../../users/user.entity';

@Entity()
export class QuestionFlag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Question)
    question: Question;

    @ManyToOne(() => User)
    reportedBy: User;

    @Column()
    reason: string; // e.g., 'wrong_answer', 'typo', 'confusing', 'other'

    @Column('text')
    description: string;

    @Column({ default: 'pending' })
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';

    @Column('text', { nullable: true })
    adminNotes: string;

    @CreateDateColumn()
    createdAt: Date;
}

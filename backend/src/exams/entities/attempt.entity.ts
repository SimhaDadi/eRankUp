import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity';
import { Model } from './model.entity';
import { Exam } from './exam.entity';
import { Response } from './response.entity';

@Entity()
@Index(['score', 'timeTaken'])
export class Attempt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Model)
    model: Model;

    @ManyToOne(() => Exam, { nullable: true })
    exam: Exam;

    @Index()
    @Column({ nullable: true })
    examId: string;

    @OneToMany(() => Response, (response) => response.attempt, { cascade: true })
    responses: Response[];

    @Index()
    @Column('float')
    score: number;

    @Column('int')
    totalQuestions: number;

    @Column('int')
    correctAnswers: number;

    @Index()
    @Column('int')
    timeTaken: number; // in seconds

    @Column('float', { default: 0 })
    accuracy: number;

    @Column('simple-json', { nullable: true })
    userAnswers: Record<string, string>; // DEPRECATED: Keep for backward compatibility, use responses instead

    @Column('simple-json', { nullable: true })
    insights: any; // AI generated insights

    @Column('simple-json', { nullable: true })
    questionTimings: Record<string, number>; // DEPRECATED: Use Response.timeSpent instead

    @Index()
    @CreateDateColumn()
    createdAt: Date;
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Model } from './model.entity';
import { Response } from './response.entity';

@Entity()
export class Attempt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Model)
    model: Model;

    @OneToMany(() => Response, (response) => response.attempt, { cascade: true })
    responses: Response[];

    @Column('float')
    score: number;

    @Column('int')
    totalQuestions: number;

    @Column('int')
    correctAnswers: number;

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

    @CreateDateColumn()
    createdAt: Date;
}

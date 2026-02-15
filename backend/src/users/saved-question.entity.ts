import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique, Column, JoinColumn } from 'typeorm';
import { Expose, Type } from 'class-transformer';
import { User } from './user.entity';
import { Question } from '../exams/entities/question.entity';

@Entity()
@Unique(['userId', 'questionId'])
export class SavedQuestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Expose()
    @Type(() => Question)
    @ManyToOne(() => Question, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'questionId' })
    question: Question;

    @Column()
    questionId: string;

    @CreateDateColumn()
    createdAt: Date;
}

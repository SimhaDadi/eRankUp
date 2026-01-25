import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Chapter } from './chapter.entity';
import { Question } from './question.entity';
import { Exam } from './exam.entity';

@Entity()
export class Model {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ default: 0 })
    totalQuestions: number;

    @Column({ default: 60 }) // Duration in minutes
    duration: number;


    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @ManyToOne(() => Chapter, (chapter) => chapter.models)
    chapter: Chapter;

    @ManyToMany(() => Question, (question) => question.models)
    @JoinTable({ name: 'model_questions' })
    questions: Question[];

    @ManyToMany(() => Exam, (exam) => exam.models)
    exams: Exam[];
}

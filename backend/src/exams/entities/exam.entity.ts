import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Model } from './model.entity';

@Entity()
export class Exam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isPremium: boolean;

    @Column('float', { default: 0 })
    price: number;

    @Column('float', { default: 1.0 })
    defaultPositiveMarks: number;

    @Column('float', { default: 0.25 })
    defaultNegativeMarks: number;

    @Column({ type: 'timestamp', nullable: true })
    startTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    endTime: Date;

    @ManyToMany(() => Model, (model) => model.exams)
    @JoinTable({ name: 'exam_models' })
    models: Model[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

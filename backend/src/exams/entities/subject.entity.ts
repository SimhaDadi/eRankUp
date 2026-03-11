import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Chapter } from './chapter.entity';
import { Exam } from './exam.entity';

@Entity()
export class Subject {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    icon: string; // Icon name from lucide/react

    @ManyToOne(() => Exam, (exam) => exam.subjects)
    @Exclude()
    exam: Exam;

    @OneToMany(() => Chapter, (chapter) => chapter.subject)
    chapters: Chapter[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

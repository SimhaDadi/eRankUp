import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity()
export class Subject {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    icon: string; // Icon name from lucide/react

    @OneToMany(() => Chapter, (chapter) => chapter.subject)
    chapters: Chapter[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

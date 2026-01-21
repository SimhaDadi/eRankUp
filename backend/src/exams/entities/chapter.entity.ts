import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Subject } from './subject.entity';
import { Model } from './model.entity';

@Entity()
export class Chapter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => Subject, (subject) => subject.chapters)
    subject: Subject;

    @OneToMany(() => Model, (model) => model.chapter)
    models: Model[];
}

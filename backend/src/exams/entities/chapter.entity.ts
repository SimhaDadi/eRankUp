import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
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
    @Exclude()
    subject: Subject;

    @OneToMany(() => Model, (model) => model.chapter)
    models: Model[];
}

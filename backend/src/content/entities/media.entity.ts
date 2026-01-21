import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Media {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @Column()
    url: string;

    @Column()
    mimeType: string;

    @Column()
    size: number;

    @CreateDateColumn()
    createdAt: Date;
}

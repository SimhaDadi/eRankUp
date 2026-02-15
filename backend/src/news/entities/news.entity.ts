import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('news_items')
export class NewsItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    summary: string;

    @Column('text')
    content: string;

    @Column()
    category: string; // e.g., 'National', 'International', 'Sports'

    @Column({ nullable: true })
    imageUrl: string;

    @Column({ nullable: true })
    source: string;

    @Column('simple-array', { nullable: true })
    tags: string[];

    @CreateDateColumn()
    publishedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

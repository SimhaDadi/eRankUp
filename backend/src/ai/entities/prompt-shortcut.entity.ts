import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('prompt_shortcut')
export class PromptShortcut {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    topic: string;

    @Column('text')
    formula: string;

    @Column('text', { nullable: true })
    keywords: string;

    @Column({ type: 'text', nullable: true }) // Migrated to vector(768) in DB
    @Exclude({ toPlainOnly: true })
    embedding: any;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

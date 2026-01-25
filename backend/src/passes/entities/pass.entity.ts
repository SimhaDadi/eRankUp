import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PassType {
    SUBSCRIPTION = 'SUBSCRIPTION',  // Monthly/Yearly recurring
    ONE_TIME = 'ONE_TIME',          // Single purchase, expires after duration
    LIFETIME = 'LIFETIME'            // Never expires
}

@Entity()
export class Pass {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column('int')
    durationDays: number;  // 0 for lifetime

    @Column('jsonb', { default: [] })
    features: string[];

    @Column({ default: true })
    @Index()
    isActive: boolean;

    @Column({ default: false })
    isPopular: boolean;

    @Column({
        type: 'enum',
        enum: PassType,
        default: PassType.SUBSCRIPTION
    })
    passType: PassType;

    // Access Control
    @Column({ default: 0 })
    maxExams: number;  // 0 = unlimited

    @Column('jsonb', { default: [] })
    includedExamTypes: string[];  // ['real_exam', 'question_bank'] or empty = all

    @Column('jsonb', { default: [] })
    excludedExamIds: string[];  // Specific exams to exclude

    // Metadata
    @Column({ default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}


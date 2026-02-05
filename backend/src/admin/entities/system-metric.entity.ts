
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('system_metrics')
export class SystemMetric {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string; // e.g., 'usage_gemini_2024-05-20'

    @Column('jsonb', { default: {} })
    value: any;

    @UpdateDateColumn()
    updatedAt: Date;
}

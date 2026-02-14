import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_metrics')
export class SystemMetric {
    @PrimaryColumn()
    key: string;

    @Column({ type: 'jsonb', nullable: true })
    value: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

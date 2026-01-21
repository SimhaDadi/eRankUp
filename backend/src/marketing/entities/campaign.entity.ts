import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CampaignStatus {
    DRAFT = 'DRAFT',
    SCHEDULED = 'SCHEDULED',
    SENDING = 'SENDING',
    SENT = 'SENT',
    FAILED = 'FAILED'
}

@Entity()
export class EmailCampaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    subject: string;

    @Column('text')
    content: string; // HTML content or Template ID

    @Column({
        type: 'enum',
        enum: CampaignStatus,
        default: CampaignStatus.DRAFT
    })
    status: CampaignStatus;

    @Column({ nullable: true })
    scheduledAt: Date;

    @Column({ nullable: true })
    sentAt: Date;

    @Column({ default: 0 })
    recipientCount: number;

    @Column({ default: 0 })
    successCount: number;

    @Column({ default: 0 })
    failureCount: number;

    @Column('simple-array', { nullable: true })
    targetAudience: string[]; // e.g., ['premium_users', 'inactive_users'] or specific user IDs

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

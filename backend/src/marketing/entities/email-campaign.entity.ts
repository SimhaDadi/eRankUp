import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class EmailCampaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    subject: string;

    @Column('text')
    body: string; // HTML content or plain text

    @Column()
    recipientType: 'ALL' | 'ACTIVE' | 'INACTIVE'; // Simple segments for now

    @Column({ default: 'DRAFT' })
    status: 'DRAFT' | 'SENT' | 'SCHEDULED';

    @Column({ nullable: true })
    sentAt: Date;

    @Column('int', { default: 0 })
    sentCount: number;

    @CreateDateColumn()
    createdAt: Date;
}

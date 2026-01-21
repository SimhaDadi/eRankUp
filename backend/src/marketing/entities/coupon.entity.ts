import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Coupon {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column()
    discountType: 'percentage' | 'fixed';

    @Column('float')
    discountValue: number;

    @Column({ nullable: true })
    maxUses: number;

    @Column({ default: 0 })
    usedCount: number;

    @Column()
    expiresAt: Date;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}

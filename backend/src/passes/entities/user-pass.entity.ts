import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity';
import { Pass } from './pass.entity';

@Entity()
@Index(['userId', 'status'])
@Index(['expiryDate'])
export class UserPass {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    @Index()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column('uuid')
    passId: string;

    @ManyToOne(() => Pass)
    @JoinColumn({ name: 'passId' })
    pass: Pass;

    // Payment Information
    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    razorpayOrderId: string;

    @Column({ nullable: true })
    razorpayPaymentId: string;

    @Column({ nullable: true })
    couponCode: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    discountAmount: number;

    @Column({ default: 'PENDING' })
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

    // Pass Validity
    @Column()
    purchaseDate: Date;

    @Column()
    @Index()
    expiryDate: Date;

    @Column({ default: 'ACTIVE' })
    @Index()
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

    // Auto-renewal (future feature)
    @Column({ default: false })
    autoRenew: boolean;

    @Column({ nullable: true })
    cancelledAt: Date;

    @Column({ nullable: true })
    cancellationReason: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

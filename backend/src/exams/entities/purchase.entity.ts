import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Exam } from './exam.entity';

@Entity()
export class Purchase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Exam)
    exam: Exam;

    @Column({ nullable: true })
    stripeSessionId: string;

    @Column({ nullable: true })
    razorpayOrderId: string;

    @Column({ nullable: true })
    razorpayPaymentId: string;

    @Column({ nullable: true })
    paymentMethod: string;

    @Column('float')
    amount: number;

    @Column({ nullable: true })
    couponCode: string;

    @Column('float', { default: 0 })
    discountAmount: number;

    @Column()
    status: 'PENDING' | 'COMPLETED' | 'FAILED';

    @CreateDateColumn()
    createdAt: Date;
}

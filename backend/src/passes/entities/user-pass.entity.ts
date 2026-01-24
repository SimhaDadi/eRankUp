import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Pass } from './pass.entity';

@Entity()
export class UserPass {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column('uuid')
    passId: string;

    @ManyToOne(() => Pass)
    @JoinColumn({ name: 'passId' })
    pass: Pass;

    @Column()
    purchaseDate: Date;

    @Column()
    expiryDate: Date;

    @Column({ default: 'ACTIVE' })
    status: string; // ACTIVE, EXPIRED

    @Column({ nullable: true })
    razorpayOrderId: string;

    @Column({ nullable: true })
    razorpayPaymentId: string;

    @CreateDateColumn()
    createdAt: Date;
}

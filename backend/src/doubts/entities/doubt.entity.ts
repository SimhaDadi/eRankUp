import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';

export enum DoubtStatus {
    PENDING = 'pending',
    ANSWERED = 'answered'
}

@Entity()
export class Doubt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: string;

    @Column('text')
    question: string;

    @Column('text', { nullable: true })
    answer: string;

    @Column({
        type: 'enum',
        enum: DoubtStatus,
        default: DoubtStatus.PENDING
    })
    status: DoubtStatus;

    @Column({ nullable: true })
    answeredBy: string;

    @Column({ type: 'timestamp', nullable: true })
    answeredAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

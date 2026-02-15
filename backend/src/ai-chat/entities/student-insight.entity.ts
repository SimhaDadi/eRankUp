import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
export class StudentInsight {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    topic: string;

    @Column('text')
    coreStruggle: string;

    @Column('float', { default: 0 })
    severity: number; // 0 to 1, how much they struggle

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

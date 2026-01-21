import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column()
    title: string;

    @Column('text')
    body: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    type: string; // 'general', 'promotion', 'alert'

    @CreateDateColumn()
    createdAt: Date;
}

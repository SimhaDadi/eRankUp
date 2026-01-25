import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

import { UserRole } from '@erankup/shared';

export { UserRole };

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // Do not return password by default
    password: string;

    @Column({ nullable: true })
    fullName: string;

    @Index()
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STUDENT,
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @Index()
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'date', nullable: true })
    dob: string;

    @Column({ nullable: true })
    education: string;

    @Column({ nullable: true })
    category: string;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    defaultLanguage: string;

    @Column({ nullable: true })
    profilePicture: string;
}

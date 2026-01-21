import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
    STUDENT = 'student',
    ADMIN = 'admin',
}

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

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STUDENT,
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    dob: Date;

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

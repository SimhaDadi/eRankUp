import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';

// Enums (Shared)
export enum UserRole {
    ADMIN = 'admin',
    STUDENT = 'student',
    TEACHER = 'teacher' // Extensible
}

export class LoginCredentialsDto {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;
}

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password!: string; // Add MinLength to match backend

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    avatar?: string;
}

export interface LoginResponse {
    access_token: string;
    user: User;
}

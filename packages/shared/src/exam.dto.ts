import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, IsDateString, Min, ValidateNested, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExamType {
    REAL_EXAM = 'real_exam',
    QUESTION_BANK = 'question_bank',
    PREVIOUS_YEAR_PAPER = 'previous_year_paper',
    LIVE_EXAM = 'live_exam'
}

export const EXAM_CATEGORIES = [
    { id: 'SSC', label: 'SSC Exams' },
    { id: 'Banking', label: 'Banking & Insurance' },
    { id: 'Railways', label: 'Railways (RRB)' },
    { id: 'Teaching', label: 'Teaching Exams' },
    { id: 'Defence', label: 'Defence' },
    { id: 'UPSC', label: 'UPSC & State PSC' },
    { id: 'Other', label: 'Other' }
] as const;

export type ExamCategory = typeof EXAM_CATEGORIES[number]['id'];

export class CreateExamDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsEnum(ExamType)
    @IsOptional()
    type?: ExamType;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsDateString()
    @IsOptional()
    startTime?: Date;

    @IsDateString()
    @IsOptional()
    endTime?: Date;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    duration?: number;

    @IsBoolean()
    @IsOptional()
    isPremium?: boolean;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    price?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    defaultPositiveMarks?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    defaultNegativeMarks?: number;
}

export class UpdateExamDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
}

// Content Hierarchy

export class CreateSubjectDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsUUID()
    @IsOptional()
    examId?: string;
}

export class UpdateSubjectDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;
}

export class CreateChapterDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    subjectId?: string;
}

export class UpdateChapterDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class CreateModelDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsDateString()
    @IsOptional()
    scheduledAt?: Date;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    duration?: number;

    @IsUUID()
    @IsOptional()
    chapterId?: string;

    @IsArray()
    @IsOptional()
    exams?: any[];
}

// Question Bank

export class QuestionDto {
    @IsString()
    @IsNotEmpty()
    text!: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsArray()
    @IsOptional()
    options?: any[];

    @IsString()
    @IsNotEmpty()
    correctOptionId!: string;

    @IsString()
    @IsOptional()
    solution?: string;
}

export class BulkCreateQuestionsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    questions!: QuestionDto[];
}

// Interfaces for UI

export interface Exam {
    id: string;
    title: string;
    description?: string;
    duration: number; // in minutes
    totalQuestions: number;
    thumbnail?: string;
    isPremium?: boolean;
    price?: number;
    subjects?: Subject[];
}

export interface Subject {
    id: string;
    title: string;
    chapters: Chapter[];
}

export interface Chapter {
    id: string;
    title: string;
    models: Model[];
}

export interface Model {
    id: string;
    title: string;
    totalQuestions: number;
    duration?: number;
}

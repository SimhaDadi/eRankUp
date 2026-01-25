import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from '../entities/exam.entity';

export class CreateExamDto {
    @IsString()
    @IsNotEmpty()
    title: string;

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

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
}

export class UpdateExamDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
}

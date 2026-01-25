import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from '../entities/exam.entity';

export class UpdateExamDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsEnum(ExamType)
    @IsOptional()
    type?: ExamType;

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

import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    // Options can be complex JSON array, keep as basic validation for now or generic array
    @IsArray()
    @IsOptional()
    options?: any[];

    @IsString()
    @IsNotEmpty()
    correctOptionId: string;

    @IsString()
    @IsOptional()
    solution?: string;
}

export class BulkCreateQuestionsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    questions: QuestionDto[];
}

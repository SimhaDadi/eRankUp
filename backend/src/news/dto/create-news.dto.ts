
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreateNewsDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    summary: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsArray()
    @IsOptional()
    tags?: string[];
}

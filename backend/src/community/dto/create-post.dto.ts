import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    category?: string;
}

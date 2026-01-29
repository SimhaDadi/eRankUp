import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsBoolean()
    @IsOptional()
    isVisible?: boolean;

    @IsInt()
    @IsOptional()
    order?: number;
}

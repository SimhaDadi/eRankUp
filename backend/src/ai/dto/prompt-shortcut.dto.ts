import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateShortcutDto {
    @IsString()
    @IsNotEmpty()
    topic: string;

    @IsString()
    @IsNotEmpty()
    formula: string;

    @IsString()
    @IsOptional()
    keywords?: string;
}

export class UpdateShortcutDto {
    @IsString()
    @IsOptional()
    topic?: string;

    @IsString()
    @IsOptional()
    formula?: string;

    @IsString()
    @IsOptional()
    keywords?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

import { IsArray, IsUUID } from 'class-validator';

export class LinkQuestionsDto {
    @IsArray()
    @IsUUID('4', { each: true })
    questionIds!: string[];
}

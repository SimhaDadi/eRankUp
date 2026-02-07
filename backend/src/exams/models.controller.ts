import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, CreateModelDto } from '@erankup/shared';
import { ExamsService } from './exams.service';

@Controller('models')
export class ModelsController {
    constructor(private readonly examsService: ExamsService) { }

    @Get()
    getModels() {
        return this.examsService.getQuestionBankModels();
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    createModel(@Body() dto: CreateModelDto) {
        return this.examsService.createModel(dto.chapterId, dto);
    }
}

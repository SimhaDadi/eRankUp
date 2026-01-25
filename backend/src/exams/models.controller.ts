import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, CreateModelDto } from '@erankup/shared';
import { ExamsService } from './exams.service';

@Controller('models')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ModelsController {
    constructor(private readonly examsService: ExamsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    createModel(@Body() dto: CreateModelDto) {
        return this.examsService.createModel(dto.chapterId, dto);
    }
}

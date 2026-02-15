import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { DoubtsService } from './doubts.service';

@Controller('doubts')
@UseGuards(AuthGuard('jwt'))
export class DoubtsController {
    constructor(private readonly doubtsService: DoubtsService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.doubtsService.findAll(req.user.userId);
    }

    @Post()
    async create(@Request() req: any, @Body('question') question: string) {
        return this.doubtsService.create(req.user.userId, question);
    }

    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAllForAdmin() {
        return this.doubtsService.findAllForAdmin();
    }

    @Post('admin/:id/answer')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async answerDoubt(
        @Param('id') id: string,
        @Body('answer') answer: string,
        @Request() req: any
    ) {
        return this.doubtsService.answerDoubt(id, answer, req.user.userId);
    }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { PassesService } from './passes.service';
import { Pass } from './entities/pass.entity';

@Controller('admin/passes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class PassesAdminController {
    constructor(private readonly passesService: PassesService) { }

    @Get()
    async getPasses() {
        return this.passesService.findPassesForAdmin();
    }

    @Post()
    async createPass(@Body() data: Partial<Pass>) {
        return this.passesService.createPass(data);
    }

    @Patch(':id')
    async updatePass(@Param('id') id: string, @Body() data: Partial<Pass>) {
        return this.passesService.updatePass(id, data);
    }

    @Delete(':id')
    async deletePass(@Param('id') id: string) {
        return this.passesService.deletePass(id);
    }
}

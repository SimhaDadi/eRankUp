import { Controller, Get, Post, Query, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin/finance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Get('overview')
    async getOverview() {
        return this.financeService.getFinancialOverview();
    }

    @Get('payments')
    async getPayments(
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Query('status') status: string
    ) {
        return this.financeService.getPayments(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            status
        );
    }

    @Post('refund/:id')
    async processRefund(@Param('id') paymentId: string) {
        try {
            return await this.financeService.processRefund(paymentId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}

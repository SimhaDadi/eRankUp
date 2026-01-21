import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { EmailService } from './email.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin/marketing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MarketingController {
    constructor(
        private readonly marketingService: MarketingService,
        private readonly emailService: EmailService
    ) { }

    @Post('coupons')
    async createCoupon(@Body() body: any) {
        return this.marketingService.createCoupon(body);
    }

    @Get('coupons')
    async getAllCoupons() {
        return this.marketingService.getAllCoupons();
    }

    @Delete('coupons/:id')
    async deleteCoupon(@Param('id') id: string) {
        return this.marketingService.deleteCoupon(id);
    }

    // --- Email Campaigns ---

    @Get('emails')
    async getCampaigns() {
        return this.emailService.getAllCampaigns();
    }

    @Post('emails')
    async createCampaign(@Body() body: any) {
        return this.emailService.createCampaign(body);
    }

    @Post('emails/:id/send')
    async sendCampaign(@Param('id') id: string) {
        return this.emailService.sendCampaign(id);
    }

    @Delete('emails/:id')
    async deleteCampaign(@Param('id') id: string) {
        return this.emailService.deleteCampaign(id);
    }
}

import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PassesService } from './passes.service';
import { PaymentsService } from '../payments/payments.service';
import { User } from '../users/user.entity';

@Controller('passes')
export class PassesController {
    constructor(
        private readonly passesService: PassesService,
        private readonly paymentsService: PaymentsService,
    ) { }

    @Get()
    async getPasses() {
        return this.passesService.getAvailablePasses();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('eligibility')
    async checkEligibility(@Request() req) {
        const userId = req.user.userId || req.user.id;
        const isTrialAvailable = await this.passesService.isTrialAvailable(userId);

        // Also check if phone is missing for free trial binding
        const user = await this.passesService.getActivePass(userId).then(() =>
            this.passesService['userPassRepository'].manager.getRepository(User).findOneBy({ id: userId })
        );

        return {
            isTrialAvailable,
            hasPhone: !!user?.phone
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('create-order')
    async createOrder(@Request() req, @Body() body: { passId: string, couponCode?: string }) {
        console.log('[DEBUG] PassesController.createOrder req.user:', JSON.stringify(req.user));
        const user = { ...req.user, id: req.user.userId };
        console.log('[DEBUG] PassesController.createOrder constructed user:', JSON.stringify(user));
        return this.paymentsService.createPassOrder(user, body.passId, body.couponCode);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('verify-payment')
    async verifyPayment(@Request() req, @Body() body: any) {
        return this.passesService.verifyPayment(req.user, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-pass')
    async getMyPass(@Request() req) {
        return this.passesService.getCurrentPass(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('current')
    async getCurrentPass(@Request() req) {
        return this.passesService.getCurrentPass(req.user.userId);
    }
}

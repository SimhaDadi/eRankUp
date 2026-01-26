import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PassesService } from './passes.service';
import { PaymentsService } from '../payments/payments.service';

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
    @Post('create-order')
    async createOrder(@Request() req, @Body() body: { passId: string, couponCode?: string }) {
        return this.paymentsService.createPassOrder(req.user, body.passId, body.couponCode);
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

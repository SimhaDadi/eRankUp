import { Controller, Post, Body, UseGuards, Req, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create-order')
    async createOrder(@Req() req, @Body('examId') examId: string, @Body('couponCode') couponCode?: string) {
        // Map JWT userId to entity id
        const user = { ...req.user, id: req.user.userId };
        return this.paymentsService.createOrder(user, examId, couponCode);
    }

    @Post('webhook')
    async handleWebhook(
        @Headers('x-razorpay-signature') sig: string,
        @Req() req: any,
    ) {
        return this.paymentsService.handleWebhook(sig, req.rawBody);
    }
}

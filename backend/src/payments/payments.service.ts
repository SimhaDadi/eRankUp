import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';
import { Purchase } from '../exams/entities/purchase.entity';
import { Exam } from '../exams/entities/exam.entity';
import { User } from '../users/user.entity';
import { MarketingService } from '../marketing/marketing.service';
import { Pass } from '../passes/entities/pass.entity';
import { UserPass } from '../passes/entities/user-pass.entity';

@Injectable()
export class PaymentsService implements OnModuleInit {
    private razorpay: any;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Purchase)
        private purchaseRepository: Repository<Purchase>,
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        @InjectRepository(UserPass)
        private userPassRepository: Repository<UserPass>,
        @InjectRepository(Pass)
        private passRepository: Repository<Pass>,
        private marketingService: MarketingService,
    ) { }

    onModuleInit() {
        this.razorpay = new Razorpay({
            key_id: this.configService.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder'),
            key_secret: this.configService.get('RAZORPAY_KEY_SECRET', 'secret_placeholder'),
        });
    }

    async createOrder(user: User, examId: string, couponCode?: string) {
        const exam = await this.examRepository.findOneBy({ id: examId });
        if (!exam || !exam.isPremium) {
            throw new Error('Exam not eligible for purchase');
        }

        let finalPrice = exam.price;
        let discountAmount = 0;

        if (couponCode) {
            try {
                // Determine discount
                const coupon = await this.marketingService.validateCoupon(couponCode, user.id);
                if (coupon) {
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (exam.price * coupon.discountValue) / 100;
                    } else {
                        discountAmount = coupon.discountValue;
                    }
                    // Ensure price doesn't go below zero
                    if (discountAmount > finalPrice) discountAmount = finalPrice;
                    finalPrice = finalPrice - discountAmount;
                }
            } catch (error) {
                // If validation fails, ignore coupon or throw? 
                // Let's throw to inform user invalid coupon
                throw new Error(`Invalid Coupon: ${error.message}`);
            }
        }

        // Razorpay handles amounts >= 1 INR (100 paise)
        if (finalPrice < 1) finalPrice = 1;

        const options = {
            amount: Math.round(finalPrice * 100), // amount in paise
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        };

        let rzpOrder;
        const keyId = this.configService.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder');

        if (keyId === 'rzp_test_placeholder' || keyId === 'test') {
            console.log('[Payments] Mocking Razorpay order creation');
            rzpOrder = {
                id: `order_mock_${Date.now()}`,
                amount: options.amount,
                currency: options.currency
            };
        } else {
            rzpOrder = await this.razorpay.orders.create(options);
        }

        const purchase = this.purchaseRepository.create({
            user,
            exam,
            razorpayOrderId: rzpOrder.id,
            amount: finalPrice,
            couponCode: couponCode || null,
            discountAmount: discountAmount,
            status: 'PENDING',
        });
        await this.purchaseRepository.save(purchase);

        return {
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: this.configService.get('RAZORPAY_KEY_ID'),
            user: {
                name: user.fullName || user.email,
                email: user.email
            },
            discountApplied: discountAmount
        };
    }

    async createPassOrder(user: User, passId: string, couponCode?: string) {
        const pass = await this.passRepository.findOneBy({ id: passId });
        if (!pass) {
            throw new Error('Pass not found');
        }

        let finalPrice = pass.price;
        let discountAmount = 0;

        if (couponCode) {
            try {
                const coupon = await this.marketingService.validateCoupon(couponCode, user.id);
                if (coupon) {
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (pass.price * coupon.discountValue) / 100;
                    } else {
                        discountAmount = coupon.discountValue;
                    }
                    if (discountAmount > finalPrice) discountAmount = finalPrice;
                    finalPrice = finalPrice - discountAmount;
                }
            } catch (error) {
                throw new Error(`Invalid Coupon: ${error.message}`);
            }
        }

        if (finalPrice < 1 && finalPrice > 0) finalPrice = 1;

        const options = {
            amount: Math.round(finalPrice * 100), // amount in paise
            currency: "INR",
            receipt: `receipt_pass_${Date.now()}`,
        };

        let rzpOrder;
        const keyId = this.configService.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder');

        if (keyId === 'rzp_test_placeholder' || keyId === 'test') {
            rzpOrder = {
                id: `order_mock_${Date.now()}`,
                amount: options.amount,
                currency: options.currency
            };
        } else {
            rzpOrder = await this.razorpay.orders.create(options);
        }

        // Calculate expiry
        const startDate = new Date();
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + pass.durationDays);

        const userPass = this.userPassRepository.create({
            user,
            pass,
            userId: user.id,
            passId: pass.id,
            purchaseDate: startDate,
            expiryDate: expiryDate,
            amount: finalPrice,
            razorpayOrderId: rzpOrder.id,
            couponCode: couponCode || null,
            discountAmount: discountAmount,
            paymentStatus: 'PENDING',
            status: 'ACTIVE'
        });
        await this.userPassRepository.save(userPass);

        return {
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: this.configService.get('RAZORPAY_KEY_ID'),
            user: {
                name: user.fullName || user.email,
                email: user.email
            },
            discountApplied: discountAmount
        };
    }

    async handleWebhook(sig: string, rawBody: Buffer) {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (expectedSig !== sig) {
            console.error('Signature mismatch', { expectedSig, receivedSig: sig });
            throw new Error('Invalid Razorpay signature');
        }

        const payload = JSON.parse(rawBody.toString());
        const event = payload.event;
        if (event === 'payment.captured' || event === 'order.paid') {
            const orderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
            const paymentId = payload.payload?.payment?.entity?.id;

            if (orderId) {
                await this.purchaseRepository.update(
                    { razorpayOrderId: orderId },
                    {
                        status: 'COMPLETED',
                        razorpayPaymentId: paymentId
                    }
                );

                await this.userPassRepository.update(
                    { razorpayOrderId: orderId },
                    {
                        paymentStatus: 'COMPLETED',
                        razorpayPaymentId: paymentId
                    }
                );
            }
        }
    }

    async hasPurchased(userId: string, examId: string): Promise<boolean> {
        const purchase = await this.purchaseRepository.findOneBy({
            user: { id: userId },
            exam: { id: examId },
            status: 'COMPLETED'
        });
        return !!purchase;
    }
}

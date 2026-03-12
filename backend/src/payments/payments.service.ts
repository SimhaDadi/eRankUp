import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';
import { Purchase } from '../exams/entities/purchase.entity';
import { Exam } from '../exams/entities/exam.entity';
import { User } from '../users/user.entity';
import { MarketingService } from '../marketing/marketing.service';
import { Pass } from '../passes/entities/pass.entity';
import { UserPass } from '../passes/entities/user-pass.entity';
import { PassesService } from '../passes/passes.service';

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
        private passesService: PassesService,
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

        // [FIX] Prevent double purchase of individual exams
        const alreadyPurchased = await this.hasPurchased(user.id, examId);
        if (alreadyPurchased) {
            throw new Error('You have already purchased this exam.');
        }

        let finalPrice = exam.price;
        let discountAmount = 0;

        if (couponCode) {
            try {
                // [FIX] Prevent coupon reuse by checking existing purchases
                const couponUsed = await this.purchaseRepository.findOne({
                    where: { user: { id: user.id }, couponCode: couponCode.toUpperCase(), status: 'COMPLETED' }
                });
                if (couponUsed) {
                    throw new BadRequestException('You have already used this coupon code.');
                }

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
                if (error instanceof BadRequestException) throw error;
                throw new BadRequestException(`Invalid Coupon: ${error.message}`);
            }
        }

        // Razorpay handles amounts >= 1 INR (100 paise)
        if (finalPrice < 1) finalPrice = 1;

        // [FIX] Use a more robust idempotency key for receipt
        const idempotencyKey = crypto.createHash('sha256').update(`${user.id}-${examId}-${couponCode || ''}`).digest('hex').substring(0, 16);

        const options = {
            amount: Math.round(finalPrice * 100), // amount in paise
            currency: "INR",
            receipt: `rcpt_${idempotencyKey}`,
        };

        let rzpOrder;
        const keyId = this.configService.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder');

        if (keyId === 'rzp_test_placeholder' || keyId === 'test') {
            console.log('[Payments] Mocking Razorpay order creation');
            rzpOrder = {
                id: `order_mock_${idempotencyKey}`,
                amount: options.amount,
                currency: options.currency
            };
        } else {
            // [FIX] Razorpay SDK does not support headers as 2nd arg for orders.create
            // Idempotency is already handled by the 'receipt' field in options
            rzpOrder = await this.razorpay.orders.create(options);
        }

        const purchase = this.purchaseRepository.create({
            user,
            exam,
            razorpayOrderId: rzpOrder.id,
            amount: finalPrice,
            couponCode: couponCode ? couponCode.toUpperCase() : null,
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

    async createPassOrder(user: any, passId: string, couponCode?: string) {
        const pass = await this.passRepository.findOneBy({ id: passId });
        if (!pass) {
            throw new Error('Pass not found');
        }
        console.log('[DEBUG] PaymentsService.createPassOrder received user:', JSON.stringify(user));
        console.log('[DEBUG] PaymentsService.createPassOrder user.id:', user.id, 'user.userId:', user.userId);

        let finalPrice = pass.price;
        let discountAmount = 0;

        if (couponCode) {
            try {
                // [FIX] Prevent coupon reuse for passes
                const couponUsed = await this.userPassRepository.findOne({
                    where: {
                        userId: user.id || user.userId,
                        couponCode: couponCode.toUpperCase(),
                        paymentStatus: 'COMPLETED'
                    }
                });
                if (couponUsed) {
                    throw new BadRequestException('You have already used this coupon code.');
                }

                const coupon = await this.marketingService.validateCoupon(couponCode, user.userId || user.id);
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
                if (error instanceof BadRequestException) throw error;
                throw new BadRequestException(`Invalid Coupon: ${error.message}`);
            }
        }

        // [FIX] Prevent double purchase of the same pass if already active
        const existingActivePass = await this.userPassRepository.findOne({
            where: {
                userId: user.id || user.userId,
                passId: pass.id,
                status: 'ACTIVE',
                expiryDate: MoreThan(new Date())
            }
        });

        if (existingActivePass) {
            throw new Error(`You already have an active "${pass.title}". Please wait for it to expire before purchasing again.`);
        }

        if (finalPrice <= 0) {
            // [FIX] Use centralized PassesService logic for trials
            const result = await this.passesService.activateFreePass(user, pass);
            return {
                ...result,
                amount: 0,
                currency: 'INR',
                keyId: null,
                user: { name: user.fullName, email: user.email },
                discountApplied: discountAmount
            };
        }

        if (finalPrice < 1) finalPrice = 1;

        // [FIX] Robust idempotency key
        const idempotencyKey = crypto.createHash('sha256').update(`${user.id || user.userId}-pass-${passId}-${couponCode || ''}`).digest('hex').substring(0, 16);

        const options = {
            amount: Math.round(finalPrice * 100), // amount in paise
            currency: "INR",
            receipt: `rcpt_pass_${idempotencyKey}`,
        };

        let rzpOrder;
        const keyId = this.configService.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder');

        if (keyId === 'rzp_test_placeholder' || keyId === 'test') {
            rzpOrder = {
                id: `order_mock_${idempotencyKey}`,
                amount: options.amount,
                currency: options.currency
            };
        } else {
            // [FIX] Razorpay SDK does not support headers as 2nd arg for orders.create
            // Idempotency is already handled by the 'receipt' field in options
            rzpOrder = await this.razorpay.orders.create(options);
        }

        // Calculate expiry
        const startDate = new Date();
        const expiryDate = this.passesService.calculateExpiryDate(startDate, pass);

        try {
            const userPass = this.userPassRepository.create({
                userId: user.id || user.userId,
                passId: pass.id,
                purchaseDate: startDate,
                expiryDate: expiryDate,
                amount: finalPrice,
                razorpayOrderId: rzpOrder.id,
                couponCode: couponCode ? couponCode.toUpperCase() : null,
                discountAmount: discountAmount,
                paymentStatus: 'PENDING',
                status: 'INACTIVE' // [FIX] Paid passes start as INACTIVE
            });
            await this.userPassRepository.save(userPass);

            return {
                id: rzpOrder.id,
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
        } catch (error) {
            console.error('CRITICAL ERROR in createPassOrder (Paid):', error);
            throw error;
        }
    }

    async handleWebhook(sig: string, rawBody: Buffer) {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        // Security: Use constant-time comparison
        const sigBuffer = Buffer.from(sig);
        const expectedSigBuffer = Buffer.from(expectedSig);

        if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
            console.error('Signature mismatch', { expectedSig, receivedSig: sig });
            throw new Error('Invalid Razorpay signature');
        }

        const payload = JSON.parse(rawBody.toString());
        const event = payload.event;
        if (event === 'payment.captured' || event === 'order.paid') {
            const orderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
            const paymentId = payload.payload?.payment?.entity?.id;

            if (orderId) {
                const paymentMethod = payload.payload?.payment?.entity?.method;

                // Robustness: Use transaction to ensure both updates succeed or fail together
                await this.purchaseRepository.manager.transaction(async transactionalEntityManager => {
                    // Update Purchase
                    await transactionalEntityManager.update(Purchase,
                        { razorpayOrderId: orderId },
                        {
                            status: 'COMPLETED',
                            razorpayPaymentId: paymentId,
                            paymentMethod: paymentMethod
                        }
                    );

                    // Update UserPass
                    const passUpdate: any = {
                        paymentStatus: 'COMPLETED',
                        status: 'ACTIVE',
                        razorpayPaymentId: paymentId,
                        paymentMethod: paymentMethod
                    };

                    await transactionalEntityManager.update(UserPass,
                        { razorpayOrderId: orderId },
                        passUpdate
                    );

                    // Update User Preferred Payment Method
                    if (paymentMethod) {
                        const purchase = await transactionalEntityManager.findOne(Purchase, {
                            where: { razorpayOrderId: orderId },
                            relations: ['user']
                        });
                        const userPass = await transactionalEntityManager.findOne(UserPass, {
                            where: { razorpayOrderId: orderId },
                            relations: ['user']
                        });

                        const userId = purchase?.user?.id || userPass?.userId;
                        if (userId) {
                            await transactionalEntityManager.update(User,
                                { id: userId },
                                { preferredPaymentMethod: paymentMethod }
                            );
                        }
                    }
                });
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

    async getPurchasedExamIds(userId: string): Promise<string[]> {
        const rawResults = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .leftJoin('purchase.exam', 'exam')
            .where('purchase.user.id = :userId', { userId })
            .andWhere('purchase.status = :status', { status: 'COMPLETED' })
            .select('exam.id', 'examId')
            .getRawMany();

        return rawResults.map(r => r.examId).filter(id => !!id);
    }
}

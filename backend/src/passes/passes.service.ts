import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Pass } from './entities/pass.entity';
import { UserPass } from './entities/user-pass.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

@Injectable()
export class PassesService implements OnModuleInit {
    private readonly logger = new Logger(PassesService.name);

    constructor(
        @InjectRepository(Pass)
        private passRepo: Repository<Pass>,
        @InjectRepository(UserPass)
        private userPassRepo: Repository<UserPass>,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        await this.seedPasses();
    }

    async seedPasses() {
        const plans = [
            {
                title: 'Starter Trial',
                description: 'Experience the full platform for 1 month absolutely free.',
                price: 0,
                durationDays: 30,
                isPopular: false,
                features: ['Full Test Series Access', 'Basic Analytics', '30 Days Validity'],
            },
            {
                title: 'Quarterly Sprint',
                description: 'Perfect for short-term exam preparation schedules.',
                price: 499,
                durationDays: 90,
                isPopular: false,
                features: ['Unlimited Tests', 'AI Performance Insights', '3 Months Validity', 'Priority Support'],
            },
            {
                title: 'Annual Elite',
                description: 'Best value for year-round preparation success.',
                price: 1499,
                durationDays: 365,
                isPopular: true,
                features: ['Unlimited Tests', 'Advanced AI Coaching', '1 Year Validity', 'Offline Download Access'],
            },
        ];

        for (const plan of plans) {
            const existing = await this.passRepo.findOne({ where: { title: plan.title } });
            if (!existing) {
                await this.passRepo.save(this.passRepo.create(plan));
                console.log(`Seeded Pass: ${plan.title}`);
            }
        }
    }

    async getAvailablePasses() {
        return this.passRepo.find({ where: { isActive: true }, order: { price: 'ASC' } });
    }

    async createOrder(user: any, passId: string) {
        const pass = await this.passRepo.findOne({ where: { id: passId } });
        if (!pass) throw new Error('Pass not found');

        // Free Pass Logic
        if (pass.price == 0) {
            return this.activateFreePass(user, pass);
        }

        // Razorpay Order Logic
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (!keyId || !keySecret) {
            this.logger.error('Razorpay keys are missing in environment variables');
            throw new Error('Payment gateway configuration error');
        }

        try {
            const instance = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });

            const options = {
                amount: Math.round(pass.price * 100),
                currency: "INR",
                receipt: `pass_order_${Date.now()}`,
            };

            const order = await instance.orders.create(options);

            // Create pending UserPass
            const userPass = this.userPassRepo.create({
                user: { id: user.userId } as any,
                pass,
                userId: user.userId,
                passId: pass.id,
                purchaseDate: new Date(),
                expiryDate: new Date(), // Placeholder
                status: 'PENDING',
                razorpayOrderId: order.id
            });
            await this.userPassRepo.save(userPass);

            return {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: keyId,
                passId: pass.id,
                userPassId: userPass.id
            };
        } catch (error) {
            this.logger.error(`Razorpay order creation failed: ${error.message}`, error.stack);
            throw new Error('Failed to create payment order');
        }
    }

    async verifyPayment(user: any, payload: { razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string }) {
        const crypto = require('crypto');
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(payload.razorpayOrderId + "|" + payload.razorpayPaymentId)
            .digest('hex');

        if (generated_signature === payload.razorpaySignature) {
            // Payment Successful
            const userPass = await this.userPassRepo.findOne({ where: { razorpayOrderId: payload.razorpayOrderId } });
            if (!userPass) throw new Error('Order not found');

            const pass = await this.passRepo.findOne({ where: { id: userPass.passId } });

            // Activate
            const now = new Date();
            const expiry = new Date(now);
            expiry.setDate(now.getDate() + pass.durationDays);

            userPass.status = 'ACTIVE';
            userPass.razorpayPaymentId = payload.razorpayPaymentId;
            userPass.purchaseDate = now;
            userPass.expiryDate = expiry;

            await this.userPassRepo.save(userPass);
            return { success: true, message: 'Pass Activated Successfully' };
        } else {
            throw new Error('Invalid Signature');
        }
    }

    private async activateFreePass(user: any, pass: Pass) {
        // Check if user already had a free trial? (Optional logic later)
        const now = new Date();
        const expiry = new Date(now);
        expiry.setDate(now.getDate() + pass.durationDays);

        const userPass = this.userPassRepo.create({
            user: { id: user.userId } as any,
            pass,
            userId: user.userId,
            passId: pass.id,
            purchaseDate: now,
            expiryDate: expiry,
            status: 'ACTIVE',
            razorpayOrderId: 'FREE_TRIAL',
            razorpayPaymentId: 'FREE_TRIAL'
        });

        await this.userPassRepo.save(userPass);
        return { success: true, message: 'Free Trial Activated', isFree: true };
    }
    async getCurrentPass(userId: string) {
        const userPass = await this.userPassRepo.findOne({
            where: {
                userId,
                status: 'ACTIVE',
            },
            relations: ['pass'],
            order: {
                expiryDate: 'DESC'
            }
        });

        if (!userPass) return null;

        if (new Date() > userPass.expiryDate) {
            userPass.status = 'EXPIRED';
            await this.userPassRepo.save(userPass);
            return null;
        }

        return userPass;
    }
}

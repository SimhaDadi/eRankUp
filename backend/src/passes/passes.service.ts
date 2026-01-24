import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pass } from './entities/pass.entity';
import { UserPass } from './entities/user-pass.entity';

@Injectable()
export class PassesService implements OnModuleInit {
    constructor(
        @InjectRepository(Pass)
        private passRepo: Repository<Pass>,
        @InjectRepository(UserPass)
        private userPassRepo: Repository<UserPass>,
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
        // Initialize Razorpay instance (using ConfigService would be better but for speed: reusing same keys)
        // TODO: Inject ConfigService properly
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
        });

        const options = {
            amount: Math.round(pass.price * 100),
            currency: "INR",
            receipt: `pass_order_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        // Store tentative UserPass (PENDING)? Or just return order details?
        // Let's create a pending UserPass to track
        const userPass = this.userPassRepo.create({
            user: { id: user.id } as any,
            pass,
            userId: user.id,
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
            keyId: process.env.RAZORPAY_KEY_ID,
            passId: pass.id,
            userPassId: userPass.id
        };
    }

    async verifyPayment(user: any, payload: { razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string }) {
        const crypto = require('crypto');
        const secret = process.env.RAZORPAY_KEY_SECRET;

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
            user: { id: user.id } as any,
            pass,
            userId: user.id,
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

import { Injectable, OnModuleInit, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { Pass, PassType } from './entities/pass.entity';
import { UserPass } from './entities/user-pass.entity';
import { User } from '../users/user.entity';

@Injectable()
export class PassesService implements OnModuleInit {
    private readonly logger = new Logger(PassesService.name);

    constructor(
        @InjectRepository(Pass)
        private passRepository: Repository<Pass>,
        @InjectRepository(UserPass)
        private userPassRepository: Repository<UserPass>,
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
                passType: PassType.ONE_TIME,
                features: ['Full Test Series Access', 'Basic Analytics', '30 Days Validity'],
                sortOrder: 1,
            },
            {
                title: 'Quarterly Sprint',
                description: 'Perfect for short-term exam preparation schedules.',
                price: 499,
                durationDays: 90,
                isPopular: false,
                passType: PassType.SUBSCRIPTION,
                features: ['Unlimited Tests', 'AI Performance Insights', '3 Months Validity', 'Priority Support'],
                sortOrder: 2,
            },
            {
                title: 'Annual Elite',
                description: 'Best value for year-round preparation success.',
                price: 1499,
                durationDays: 365,
                isPopular: true,
                passType: PassType.SUBSCRIPTION,
                features: ['Unlimited Tests', 'Advanced AI Coaching', '1 Year Validity', 'Offline Download Access'],
                sortOrder: 3,
            },
        ];

        for (const plan of plans) {
            const existing = await this.passRepository.findOne({ where: { title: plan.title } });
            if (!existing) {
                await this.passRepository.save(this.passRepository.create(plan));
                this.logger.log(`Seeded Pass: ${plan.title}`);
            }
        }
    }

    // ==================== Pass Management ====================

    async findAllPasses(): Promise<Pass[]> {
        return this.passRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC', price: 'ASC' }
        });
    }

    async findPassesForAdmin(): Promise<Pass[]> {
        return this.passRepository.find({
            order: { sortOrder: 'ASC', createdAt: 'DESC' }
        });
    }

    async findPassById(id: string): Promise<Pass> {
        const pass = await this.passRepository.findOne({ where: { id } });
        if (!pass) throw new NotFoundException('Pass not found');
        return pass;
    }

    async createPass(data: Partial<Pass>): Promise<Pass> {
        const pass = this.passRepository.create(data);
        return this.passRepository.save(pass);
    }

    async updatePass(id: string, data: Partial<Pass>): Promise<Pass> {
        const pass = await this.findPassById(id);
        Object.assign(pass, data);
        return this.passRepository.save(pass);
    }

    async deletePass(id: string): Promise<void> {
        const pass = await this.findPassById(id);
        await this.passRepository.remove(pass);
    }

    // ==================== User Pass Management ====================

    async createUserPass(
        user: User,
        passId: string,
        paymentDetails: {
            razorpayOrderId: string;
            amount: number;
            couponCode?: string;
            discountAmount?: number;
        }
    ): Promise<UserPass> {
        const pass = await this.findPassById(passId);

        const purchaseDate = new Date();
        const expiryDate = this.calculateExpiryDate(purchaseDate, pass);

        const userPass = this.userPassRepository.create({
            user,
            pass,
            userId: user.id,
            passId: pass.id,
            purchaseDate,
            expiryDate,
            amount: paymentDetails.amount,
            razorpayOrderId: paymentDetails.razorpayOrderId,
            couponCode: paymentDetails.couponCode,
            discountAmount: paymentDetails.discountAmount || 0,
            paymentStatus: 'PENDING',
            status: 'INACTIVE' // [FIX] Start as INACTIVE, only ACTIVE after payment
        });

        return this.userPassRepository.save(userPass);
    }

    async activateFreePass(user: any, pass: Pass): Promise<any> {
        const userId = user.userId || user.id;
        const available = await this.isTrialAvailable(userId);
        if (!available) {
            throw new BadRequestException('Free trial not available for this account/phone number');
        }

        const now = new Date();
        const expiry = this.calculateExpiryDate(now, pass);

        const userPass = this.userPassRepository.create({
            user: { id: userId } as any,
            pass,
            userId: userId,
            passId: pass.id,
            purchaseDate: now,
            expiryDate: expiry,
            amount: 0,
            status: 'ACTIVE',
            paymentStatus: 'COMPLETED',
            razorpayOrderId: `FREE_TRIAL_${Date.now()}`,
            razorpayPaymentId: 'FREE_TRIAL'
        });

        await this.userPassRepository.save(userPass);
        return { success: true, message: 'Free Trial Activated', isFree: true, orderId: userPass.razorpayOrderId };
    }

    async completePayment(razorpayOrderId: string, razorpayPaymentId: string): Promise<UserPass> {
        this.logger.log(`[CompletePayment] Searching for UserPass with OrderId: ${razorpayOrderId}`);
        const userPass = await this.userPassRepository.findOne({
            where: { razorpayOrderId }
        });

        if (!userPass) {
            this.logger.error(`[CompletePayment] UserPass NOT FOUND for OrderId: ${razorpayOrderId}`);
            throw new NotFoundException('User pass not found');
        }

        if (userPass.paymentStatus === 'COMPLETED') {
            this.logger.log(`[CompletePayment] UserPass ${userPass.id} already COMPLETED. Skipping.`);
            return userPass;
        }

        this.logger.log(`[CompletePayment] UserPass found: ${userPass.id}. Updating to COMPLETED.`);
        userPass.paymentStatus = 'COMPLETED';
        userPass.status = 'ACTIVE'; // [FIX] Activate pass on payment completion
        userPass.razorpayPaymentId = razorpayPaymentId;

        return this.userPassRepository.save(userPass);
    }

    async failPayment(razorpayOrderId: string): Promise<UserPass> {
        this.logger.log(`[FailPayment] Marking failure for OrderId: ${razorpayOrderId}`);
        const userPass = await this.userPassRepository.findOne({
            where: { razorpayOrderId }
        });

        if (!userPass) {
            this.logger.error(`[FailPayment] UserPass NOT FOUND for OrderId: ${razorpayOrderId}`);
            throw new NotFoundException('User pass not found');
        }

        userPass.paymentStatus = 'FAILED';
        userPass.status = 'CANCELLED';

        return this.userPassRepository.save(userPass);
    }

    // ==================== Access Control ====================

    async hasActivePass(userId: string): Promise<boolean> {
        const activePasses = await this.getActivePasses(userId);
        return activePasses.length > 0;
    }

    async getActivePasses(userId: string): Promise<UserPass[]> {
        return this.userPassRepository.find({
            where: {
                userId,
                status: 'ACTIVE',
                paymentStatus: 'COMPLETED',
                expiryDate: MoreThan(new Date())
            },
            relations: ['pass'],
            order: { expiryDate: 'DESC' }
        });
    }

    // Keep for legacy compatibility, returns the one with latest expiry
    async getActivePass(userId: string): Promise<UserPass | null> {
        const passes = await this.getActivePasses(userId);
        return passes.length > 0 ? passes[0] : null;
    }

    async getUserPasses(userId: string): Promise<UserPass[]> {
        return this.userPassRepository.find({
            where: { userId },
            relations: ['pass'],
            order: { createdAt: 'DESC' }
        });
    }

    async isTrialAvailable(userId: string): Promise<boolean> {
        // 1. Fetch current user to get their phone number
        const user = await this.userPassRepository.manager.getRepository(User).findOne({
            where: { id: userId }
        });

        if (!user) return false;

        // 2. Check if THIS user has already claimed/purchased a trial
        const directTrial = await this.userPassRepository.findOne({
            where: {
                userId,
                amount: 0,
                paymentStatus: 'COMPLETED' // [FIX] Only check successful ones
            }
        });
        if (directTrial) return false;

        // 3. Check if any OTHER user with the SAME PHONE has claimed a trial
        if (user.phone) {
            const phoneTrial = await this.userPassRepository.findOne({
                where: {
                    user: { phone: user.phone },
                    amount: 0,
                    paymentStatus: 'COMPLETED' // [FIX] Only check successful ones
                },
                relations: ['user']
            });
            if (phoneTrial) return false;
        }

        return true;
    }

    async canAccessExam(userId: string, examId: string, examType: string, preFetchedPasses?: UserPass[]): Promise<boolean> {
        const activePasses = preFetchedPasses || await this.getActivePasses(userId);
        if (activePasses.length === 0) return false;

        // [FIX] Check all active passes. If any pass grants access, allow it.
        for (const userPass of activePasses) {
            const pass = userPass.pass;

            // 1. Check if exam is explicitly excluded (overrides everything)
            if (pass.excludedExamIds?.includes(examId)) {
                continue; // This pass doesn't help, try another
            }

            // 2. Check if exam type is included
            const typeIsIncluded = pass.includedExamTypes.length === 0 || pass.includedExamTypes.includes(examType);

            if (typeIsIncluded) {
                // Future check: maxExams limit would go here
                return true;
            }
        }

        return false;
    }

    // ==================== Pass Lifecycle ====================

    async cancelPass(userPassId: string, reason: string): Promise<UserPass> {
        const userPass = await this.userPassRepository.findOne({ where: { id: userPassId } });
        if (!userPass) throw new NotFoundException('User pass not found');

        userPass.status = 'CANCELLED';
        userPass.cancelledAt = new Date();
        userPass.cancellationReason = reason;

        return this.userPassRepository.save(userPass);
    }

    async renewPass(userId: string, passId: string): Promise<UserPass> {
        // Get current active pass
        const currentPass = await this.getActivePass(userId);

        // Create new pass starting from current expiry or now (whichever is later)
        const startDate = currentPass && currentPass.expiryDate > new Date()
            ? currentPass.expiryDate
            : new Date();

        const pass = await this.findPassById(passId);
        const expiryDate = this.calculateExpiryDate(startDate, pass);

        // This would typically be called after payment, so we'd have payment details
        // For now, this is a placeholder
        throw new BadRequestException('Renewal must go through payment flow');
    }

    // ==================== Utilities ====================

    public calculateExpiryDate(startDate: Date, pass: Pass): Date {
        if (pass.passType === PassType.LIFETIME) {
            // Set to 100 years in the future (effectively lifetime)
            const expiryDate = new Date(startDate);
            expiryDate.setFullYear(expiryDate.getFullYear() + 100);
            return expiryDate;
        }

        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + (pass.durationDays || 0));
        return expiryDate;
    }

    // ==================== Cron Jobs ====================

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async expirePassesCron() {
        const expiredPasses = await this.userPassRepository.find({
            where: {
                status: 'ACTIVE',
                expiryDate: LessThan(new Date())
            }
        });

        for (const userPass of expiredPasses) {
            userPass.status = 'EXPIRED';
            await this.userPassRepository.save(userPass);
        }

        this.logger.log(`Expired ${expiredPasses.length} passes`);
    }

    // ==================== Legacy Methods (Keep for compatibility) ====================

    async getAvailablePasses() {
        return this.findAllPasses();
    }

    async getCurrentPass(userId: string) {
        return this.getActivePass(userId);
    }

    /*
    async createOrder(user: any, passId: string) {
        // This method is kept for backward compatibility
        // New code should use PaymentsService.createPassOrder instead
        this.logger.warn('createOrder is deprecated, use PaymentsService.createPassOrder instead');
        const pass = await this.findPassById(passId);

        // Free Pass Logic
        if (pass.price == 0) {
            return this.activateFreePass(user, pass);
        }

        throw new BadRequestException('Use PaymentsService.createPassOrder for paid passes');
    }
    */

    async verifyPayment(user: any, payload: { razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string }) {
        this.logger.log(`[VerifyPayment] Verifying for User: ${user.userId || user.id}, Order: ${payload.razorpayOrderId}`);

        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (!secret) {
            this.logger.error('[VerifyPayment] RAZORPAY_KEY_SECRET is missing in config!');
            throw new Error('Server misconfiguration: Missing Secret');
        }

        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(payload.razorpayOrderId + "|" + payload.razorpayPaymentId)
            .digest('hex');

        this.logger.log(`[VerifyPayment] Sig Generated: ${generated_signature}, Received: ${payload.razorpaySignature}`);

        const sigBuffer = Buffer.from(payload.razorpaySignature);
        const generatedSigBuffer = Buffer.from(generated_signature);

        if (sigBuffer.length === generatedSigBuffer.length && crypto.timingSafeEqual(sigBuffer, generatedSigBuffer)) {
            await this.completePayment(payload.razorpayOrderId, payload.razorpayPaymentId);
            this.logger.log('[VerifyPayment] Signature Verified & Payment Completed');
            return { success: true, message: 'Pass Activated Successfully' };
        } else {
            this.logger.error('[VerifyPayment] Signature Verification Failed');
            throw new Error('Invalid Signature');
        }
    }

    // Removed private activateFreePass as it's now public activateFreePass
}


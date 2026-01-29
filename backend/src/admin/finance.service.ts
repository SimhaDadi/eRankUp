import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from '../exams/entities/purchase.entity';
import { UserPass } from '../passes/entities/user-pass.entity';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');

@Injectable()
export class FinanceService {
    private razorpay: any;

    constructor(
        @InjectRepository(Purchase)
        private purchaseRepository: Repository<Purchase>,
        @InjectRepository(UserPass)
        private userPassRepository: Repository<UserPass>,
        private configService: ConfigService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
        });
    }

    async getFinancialOverview() {
        // Total Revenue (Purchases + Passes)
        const purchaseRevenueResult = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .select('SUM(purchase.amount)', 'total')
            .where("purchase.status = 'COMPLETED'")
            .getRawOne();
        const purchaseRevenue = parseFloat(purchaseRevenueResult.total) || 0;

        const passRevenueResult = await this.userPassRepository
            .createQueryBuilder('userPass')
            .select('SUM(userPass.amount)', 'total')
            .where("userPass.paymentStatus = 'COMPLETED'")
            .getRawOne();
        const passRevenue = parseFloat(passRevenueResult.total) || 0;

        const totalRevenue = purchaseRevenue + passRevenue;

        // Today's Revenue
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayPurchaseResult = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .select('SUM(purchase.amount)', 'total')
            .where("purchase.status = 'COMPLETED'")
            .andWhere("purchase.createdAt >= :startOfDay", { startOfDay })
            .getRawOne();
        const todayPurchase = parseFloat(todayPurchaseResult.total) || 0;

        const todayPassResult = await this.userPassRepository
            .createQueryBuilder('userPass')
            .select('SUM(userPass.amount)', 'total')
            .where("userPass.paymentStatus = 'COMPLETED'")
            .andWhere("userPass.createdAt >= :startOfDay", { startOfDay })
            .getRawOne();
        const todayPass = parseFloat(todayPassResult.total) || 0;

        const todayRevenue = todayPurchase + todayPass;

        // Transaction Counts (Purchases + Passes)
        const pCompleted = await this.purchaseRepository.count({ where: { status: 'COMPLETED' } });
        const pPending = await this.purchaseRepository.count({ where: { status: 'PENDING' } });
        const pFailed = await this.purchaseRepository.count({ where: { status: 'FAILED' } });

        const upCompleted = await this.userPassRepository.count({ where: { paymentStatus: 'COMPLETED' } });
        const upPending = await this.userPassRepository.count({ where: { paymentStatus: 'PENDING' } });
        const upFailed = await this.userPassRepository.count({ where: { paymentStatus: 'FAILED' } });
        const upRefunded = await this.userPassRepository.count({ where: { paymentStatus: 'REFUNDED' } });

        return {
            totalRevenue,
            todayRevenue,
            transactionStats: {
                completed: pCompleted + upCompleted,
                pending: pPending + upPending,
                failed: pFailed + upFailed + upRefunded // grouping refunded with failed/others for simplicity, or just failed
            }
        };
    }

    async getPayments(page: number = 1, limit: number = 20, status?: string) {
        // Strategy: Fetch page*limit from BOTH, combine, sort, splice.
        // This ensures correct ordering across the mixed sets for the first few pages (most common use case).
        const fetchLimit = page * limit;

        // 1. Fetch Purchases
        const purchaseQuery = this.purchaseRepository.createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.user', 'user')
            .leftJoinAndSelect('purchase.exam', 'exam')
            .orderBy('purchase.createdAt', 'DESC')
            .take(fetchLimit);

        if (status && status !== 'ALL') {
            purchaseQuery.where('purchase.status = :status', { status });
        }
        const purchases = await purchaseQuery.getMany();

        // 2. Fetch UserPasses
        const passQuery = this.userPassRepository.createQueryBuilder('userPass')
            .leftJoinAndSelect('userPass.user', 'user')
            .leftJoinAndSelect('userPass.pass', 'pass')
            .orderBy('userPass.createdAt', 'DESC')
            .take(fetchLimit);

        if (status && status !== 'ALL') {
            // Map status. If status is a generic one, use it. UserPass has REFUNDED too.
            passQuery.where('userPass.paymentStatus = :status', { status });
        }
        const passes = await passQuery.getMany();

        // 3. Normalize & Combine
        const normalizedPurchases = purchases.map(p => ({
            id: p.id,
            user: {
                name: p.user?.fullName || 'Unknown',
                email: p.user?.email || 'Unknown'
            },
            exam: p.exam?.title || 'Unknown Exam',
            amount: p.amount,
            status: p.status,
            orderId: p.razorpayOrderId,
            paymentId: p.razorpayPaymentId,
            date: p.createdAt,
            type: 'EXAM'
        }));

        const normalizedPasses = passes.map(p => ({
            id: p.id,
            user: {
                name: p.user?.fullName || 'Unknown',
                email: p.user?.email || 'Unknown'
            },
            exam: p.pass?.title || 'Subscription Pass', // Mapping Pass Title to "Exam" column for UI consistency
            amount: p.amount,
            status: p.paymentStatus,
            orderId: p.razorpayOrderId,
            paymentId: p.razorpayPaymentId,
            date: p.createdAt,
            type: 'PASS'
        }));

        const allTransactions = [...normalizedPurchases, ...normalizedPasses];

        // 4. Sort Combined
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 5. Slice for Pagination
        const paginatedTransactions = allTransactions.slice((page - 1) * limit, page * limit);

        // Total count approximation (sum of both total counts)
        // We need accurate total for "Next" button logic if we want to be precise, 
        // but for now, returning a large number or summing independent counts is fine.
        const totalPurchases = await this.purchaseRepository.count(
            status && status !== 'ALL' ? { where: { status: status as any } } : {}
        );
        const totalPasses = await this.userPassRepository.count(
            status && status !== 'ALL' ? { where: { paymentStatus: status as any } } : {}
        );

        return {
            payments: paginatedTransactions,
            total: totalPurchases + totalPasses,
            page,
            limit
        };
    }

    async processRefund(paymentId: string) {
        // Try to find in Purchases first
        let purchase = await this.purchaseRepository.findOne({ where: { razorpayPaymentId: paymentId } });

        if (purchase) {
            return this.refundWithRazorpay(paymentId, 'purchase');
        }

        // Try UserPass
        let userPass = await this.userPassRepository.findOne({ where: { razorpayPaymentId: paymentId } });
        if (userPass) {
            return this.refundWithRazorpay(paymentId, 'pass');
        }

        throw new Error('Transaction record not found for this payment ID');
    }

    private async refundWithRazorpay(paymentId: string, type: 'purchase' | 'pass') {
        try {
            const refund = await this.razorpay.payments.refund(paymentId, {
                notes: { reason: "Admin initiated refund" }
            });
            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount,
                status: refund.status
            };
        } catch (error) {
            console.error('Refund failed:', error);
            throw new Error(error.error?.description || 'Failed to process refund');
        }
    }
}

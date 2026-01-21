import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from '../exams/entities/purchase.entity';
import { ConfigService } from '@nestjs/config';
import Razorpay = require('razorpay');

@Injectable()
export class FinanceService {
    private razorpay: any;

    constructor(
        @InjectRepository(Purchase)
        private purchaseRepository: Repository<Purchase>,
        private configService: ConfigService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
        });
    }

    async getFinancialOverview() {
        // Total Revenue
        const totalRevenueResult = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .select('SUM(purchase.amount)', 'total')
            .where("purchase.status = 'COMPLETED'")
            .getRawOne();
        const totalRevenue = parseFloat(totalRevenueResult.total) || 0;

        // Today's Revenue
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayRevenueResult = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .select('SUM(purchase.amount)', 'total')
            .where("purchase.status = 'COMPLETED'")
            .andWhere("purchase.createdAt >= :startOfDay", { startOfDay })
            .getRawOne();
        const todayRevenue = parseFloat(todayRevenueResult.total) || 0;

        // Pending vs Completed (Reconciliation Stats)
        const completedCount = await this.purchaseRepository.count({ where: { status: 'COMPLETED' } });
        const pendingCount = await this.purchaseRepository.count({ where: { status: 'PENDING' } });
        const failedCount = await this.purchaseRepository.count({ where: { status: 'FAILED' } });

        return {
            totalRevenue,
            todayRevenue,
            transactionStats: {
                completed: completedCount,
                pending: pendingCount,
                failed: failedCount
            }
        };
    }

    async getPayments(page: number = 1, limit: number = 20, status?: string) {
        const queryBuilder = this.purchaseRepository.createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.user', 'user')
            .leftJoinAndSelect('purchase.exam', 'exam')
            .orderBy('purchase.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status && status !== 'ALL') {
            queryBuilder.where('purchase.status = :status', { status });
        }

        const [purchases, total] = await queryBuilder.getManyAndCount();

        return {
            payments: purchases.map(p => ({
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
                date: p.createdAt
            })),
            total,
            page,
            limit
        };
    }

    async processRefund(paymentId: string) {
        // Find the purchase first
        const purchase = await this.purchaseRepository.findOne({ where: { razorpayPaymentId: paymentId } });
        if (!purchase) {
            throw new Error('Purchase record not found for this payment ID');
        }

        try {
            // Initiate refund with Razorpay
            // Note: In a real scenario, you usually pass amount if partial refund, or speed (opt)
            const refund = await this.razorpay.payments.refund(paymentId, {
                notes: {
                    reason: "Admin initiated refund"
                }
            });

            // Update local record status (or creating a Refund entity would be better, but simpler for now)
            // Ideally we might want to mark status as 'REFUNDED' or similar if we had that enum value
            // For now, we'll log it or assume 'FAILED' equivalent or just keep it 'COMPLETED' but flagged.
            // Let's assume we don't change the status 'COMPLETED' purely based on refund initiation without webhook confirmation
            // but for UX we return success.

            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount,
                status: refund.status
            };
        } catch (error) {
            console.error('Refund failed:', error);
            throw new Error(error.error?.description || 'Failed to process refund with Payment Gateway');
        }
    }
}

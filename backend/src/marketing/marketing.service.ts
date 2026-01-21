import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class MarketingService {
    constructor(
        @InjectRepository(Coupon)
        private couponRepository: Repository<Coupon>,
    ) { }

    async createCoupon(data: {
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        expiresAt: Date;
        maxUses?: number;
    }) {
        // Check if code exists
        const existing = await this.couponRepository.findOne({ where: { code: data.code.toUpperCase() } });
        if (existing) {
            throw new Error('Coupon code already exists');
        }

        const coupon = this.couponRepository.create({
            ...data,
            code: data.code.toUpperCase()
        });
        return this.couponRepository.save(coupon);
    }

    async getAllCoupons() {
        return this.couponRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async deleteCoupon(id: string) {
        return this.couponRepository.delete(id);
    }

    async validateCoupon(code: string, _userId?: string) {
        const coupon = await this.couponRepository.findOne({ where: { code: code.toUpperCase() } });

        if (!coupon) throw new Error('Invalid code');
        if (!coupon.isActive) throw new Error('Coupon is inactive');
        if (new Date() > coupon.expiresAt) throw new Error('Coupon expired');
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error('Usage limit reached');

        // Future: Check if this user already used this coupon (requires generic Usage entity or similar)

        return coupon;
    }
}

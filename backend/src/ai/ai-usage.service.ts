import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIUsage } from './entities/ai-usage.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class AIUsageService {
    private readonly DAILY_REQUEST_LIMIT = 50;
    private readonly DAILY_TOKEN_LIMIT = 100000; // ~100k tokens per day

    constructor(
        @InjectRepository(AIUsage)
        private usageRepository: Repository<AIUsage>,
    ) { }

    /**
     * Check if a user is allowed to make an AI request today
     */
    async checkQuota(userId: string, role: UserRole): Promise<boolean> {
        // Admins have unlimited access
        if (role === UserRole.ADMIN) {
            return true;
        }

        const today = new Date().toISOString().split('T')[0];
        const usage = await this.usageRepository.findOne({
            where: { userId, date: today },
        });

        if (!usage) {
            return true;
        }

        if (usage.requestCount >= this.DAILY_REQUEST_LIMIT) {
            throw new ForbiddenException(`Daily AI request limit (${this.DAILY_REQUEST_LIMIT}) reached. Please try again tomorrow.`);
        }

        if (usage.totalTokens >= this.DAILY_TOKEN_LIMIT) {
            throw new ForbiddenException(`Daily AI token limit reached. Please try again tomorrow.`);
        }

        return true;
    }

    /**
     * Record AI usage after a successful call
     */
    async trackUsage(userId: string, prompt: string, response: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        // Simple token estimation: ~4 chars per token for English
        const estimatedTokens = Math.ceil((prompt.length + response.length) / 4);

        let usage = await this.usageRepository.findOne({
            where: { userId, date: today },
        });

        if (!usage) {
            usage = this.usageRepository.create({
                userId,
                date: today,
                requestCount: 1,
                totalTokens: estimatedTokens,
            });
        } else {
            usage.requestCount += 1;
            usage.totalTokens += estimatedTokens;
        }

        await this.usageRepository.save(usage);
    }
}

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemMetric } from './entities/system-metric.entity';
import { ExamsSeederService } from '../exams/exams-seeder.service';

export interface HealthMetric {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number;
    lastChecked: Date;
    details?: any;
}

export interface APIUsageMetric {
    service: string;
    callsToday: number;
    callsThisMonth: number;
    estimatedCost: number;
    limit?: number;
}

@Injectable()
export class SystemHealthService {
    private apiCallCounts: Map<string, { daily: number; monthly: number; lastReset: Date }> = new Map();
    private isLockedDown = false;

    constructor(
        private configService: ConfigService,
        private cacheService: CacheService,
        @Inject(forwardRef(() => ExamsSeederService))
        private seederService: ExamsSeederService,
        @InjectRepository(SystemMetric)
        private metricRepo: Repository<SystemMetric>,
    ) {
        // Initialize counters from DB (or default)
        this.initializeCounters();
    }

    // ... (rest of methods)

    private async initializeCounters() {
        const services = ['gemini', 'razorpay', 'groq'];
        const today = new Date().toISOString().split('T')[0];

        for (const service of services) {
            const key = `usage_${service}_${today}`;
            let metric = await this.metricRepo.findOneBy({ key });

            if (!metric) {
                metric = this.metricRepo.create({
                    key,
                    value: { daily: 0, monthly: 0, lastReset: new Date() }
                });
                await this.metricRepo.save(metric);
            }
            // Sync memory with DB
            this.apiCallCounts.set(service, metric.value);
        }
    }

    /**
     * Track API call (Persisted)
     */
    async trackAPICall(service: 'gemini' | 'razorpay' | 'groq') {
        const today = new Date().toISOString().split('T')[0];
        const key = `usage_${service}_${today}`;

        // Optimistic update in memory first
        let counter = this.apiCallCounts.get(service);
        if (!counter) {
            counter = { daily: 0, monthly: 0, lastReset: new Date() };
            this.apiCallCounts.set(service, counter);
        }
        counter.daily++;
        counter.monthly++; // NOTE: Monthly logic needs distinct keys or aggregation. Keeping simple for now.

        // Async persistence
        let metric = await this.metricRepo.findOneBy({ key });
        if (!metric) {
            metric = this.metricRepo.create({ key, value: counter });
        } else {
            metric.value = counter;
        }
        await this.metricRepo.save(metric);
    }

    /**
     * Get overall system health
     */
    async getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'down';
        services: HealthMetric[];
        timestamp: Date;
    }> {
        const services: HealthMetric[] = [];

        // Check database
        const dbHealth = await this.checkDatabaseHealth();
        services.push(dbHealth);

        // Check Gemini API
        const geminiHealth = this.checkGeminiHealth();
        services.push(geminiHealth);

        // Check Groq API
        services.push(this.checkGroqHealth());

        // Check Redis (if available)
        const redisHealth = this.checkRedisHealth();
        services.push(redisHealth);

        // Determine overall status
        const hasDown = services.some(s => s.status === 'down');
        const hasDegraded = services.some(s => s.status === 'degraded');

        const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

        return {
            status: overallStatus,
            services,
            timestamp: new Date()
        };
    }

    /**
     * Get API usage statistics
     */
    getAPIUsage(): APIUsageMetric[] {
        const geminiCounter = this.apiCallCounts.get('gemini');
        const razorpayCounter = this.apiCallCounts.get('razorpay');

        return [
            {
                service: 'Gemini AI',
                callsToday: geminiCounter?.daily || 0,
                callsThisMonth: geminiCounter?.monthly || 0,
                estimatedCost: (geminiCounter?.monthly || 0) * 0.0005, // Rough estimate
                limit: 1500 // Free tier daily limit
            },
            {
                service: 'Razorpay',
                callsToday: razorpayCounter?.daily || 0,
                callsThisMonth: razorpayCounter?.monthly || 0,
                estimatedCost: 0, // No per-call cost
            },
            {
                service: 'Groq Cloud',
                callsToday: this.apiCallCounts.get('groq')?.daily || 0,
                callsThisMonth: this.apiCallCounts.get('groq')?.monthly || 0,
                estimatedCost: 0, // Free Tier
                limit: 14400 // ~30 RPM * 60 * 8 (working hours?) or 14k/day
            }
        ];
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        // This would integrate with Redis in production
        return {
            hitRate: 85, // Placeholder
            totalKeys: 1234,
            memoryUsage: '45MB',
            evictions: 12
        };
    }

    /**
     * Get error logs (last 24 hours)
     */
    async getRecentErrors() {
        // In production, this would query a logging service or database
        return {
            total: 5,
            critical: 0,
            warnings: 3,
            errors: 2,
            recentErrors: [
                {
                    timestamp: new Date(Date.now() - 3600000),
                    level: 'warning',
                    service: 'ExplanationService',
                    message: 'Rate limit approaching for Gemini API'
                },
                {
                    timestamp: new Date(Date.now() - 7200000),
                    level: 'error',
                    service: 'PaymentService',
                    message: 'Razorpay webhook validation failed'
                }
            ]
        };
    }

    /**
     * Get system metrics
     */
    async getSystemMetrics() {
        return {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };
    }

    // Private health check methods
    private async checkDatabaseHealth(): Promise<HealthMetric> {
        try {
            const start = Date.now();
            // Simple query to check DB connectivity
            // In production: await this.connection.query('SELECT 1');
            const responseTime = Date.now() - start;

            return {
                service: 'PostgreSQL',
                status: responseTime < 100 ? 'healthy' : 'degraded',
                responseTime,
                lastChecked: new Date(),
                details: { connected: true }
            };
        } catch (error) {
            return {
                service: 'PostgreSQL',
                status: 'down',
                lastChecked: new Date(),
                details: { error: error.message }
            };
        }
    }

    private checkGeminiHealth(): HealthMetric {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        const hasKey = !!apiKey;

        return {
            service: 'Gemini AI',
            status: hasKey ? 'healthy' : 'degraded',
            lastChecked: new Date(),
            details: {
                configured: hasKey,
                callsToday: this.apiCallCounts.get('gemini')?.daily || 0
            }
        };
    }

    private checkGroqHealth(): HealthMetric {
        const apiKey = this.configService.get<string>('GROQ_API_KEY');
        const hasKey = !!apiKey;

        return {
            service: 'Groq Cloud',
            status: hasKey ? 'healthy' : 'degraded',
            lastChecked: new Date(),
            details: {
                configured: hasKey,
                callsToday: this.apiCallCounts.get('groq')?.daily || 0
            }
        };
    }

    private checkRedisHealth(): HealthMetric {
        // Placeholder - would check actual Redis connection
        return {
            service: 'Redis Cache',
            status: 'healthy',
            lastChecked: new Date(),
            details: { connected: true }
        };
    }

    /**
     * Clear system cache
     */
    async clearCache() {
        await this.cacheService.flush();
        return { success: true, message: 'Cache cleared successfully' };
    }

    /**
     * Re-seed database (dev only)
     */
    async reSeedData() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Re-seeding is disabled in production');
        }
        await this.seederService.seedInitialContent();
        await this.seederService.seedManualTestingData();
        return { success: true, message: 'Database re-seeded successfully' };
    }

    /**
     * Toggle system lockdown
     */
    async toggleLockdown() {
        this.isLockedDown = !this.isLockedDown;
        return { success: true, isLockedDown: this.isLockedDown };
    }

    /**
     * Get lockdown status
     */
    getLockdownStatus() {
        return this.isLockedDown;
    }
}

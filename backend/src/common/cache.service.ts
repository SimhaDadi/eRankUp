import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
    private redis: Redis;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        if (!data) return null;
        return JSON.parse(data);
    }

    async set(key: string, value: any, ttlInSeconds: number = 3600): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
        } catch (error) {
            console.error(`[CacheService] Failed to set key ${key}:`, error.message);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error(`[CacheService] Failed to delete key ${key}:`, error.message);
        }
    }

    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error(`[CacheService] Failed to invalidate pattern ${pattern}:`, error.message);
        }
    }

    async flush(): Promise<void> {
        try {
            await this.redis.flushall();
        } catch (error) {
            console.error(`[CacheService] Failed to flush cache:`, error.message);
        }
    }
}

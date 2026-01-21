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
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async invalidatePattern(pattern: string): Promise<void> {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }

    async flush(): Promise<void> {
        await this.redis.flushall();
    }
}

import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

async function clearCache() {
    // Connect to Redis using ioredis which is already installed
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    redis.on('error', (err) => console.log('Redis Client Error', err));

    try {
        const keys = [
            'exams:all:all',
            'exams:all:real_exam',
            'exams:all:question_bank',
            'exams:all:admin:all',
            'exams:all:admin:real_exam',
            'exams:all:admin:question_bank'
        ];

        const count = await redis.del(keys);
        console.log(`Cleared ${count} keys from Redis.`);
    } catch (e: any) {
        console.log('Error clearing keys:', e.message);
    } finally {
        await redis.quit();
    }
}

clearCache();

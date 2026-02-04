const Redis = require('ioredis');
require('dotenv').config();

async function clearCache() {
    const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    });

    console.log('Connecting to Redis...');
    try {
        await redis.flushall();
        console.log('✅ Cache cleared successfully (FLUSHALL).');
    } catch (error) {
        console.error('❌ Failed to clear cache:', error);
    } finally {
        redis.disconnect();
    }
}

clearCache();

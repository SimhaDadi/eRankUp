const Redis = require('ioredis');
const redis = new Redis({
    host: 'localhost',
    port: 6379,
});

async function clearExams() {
    try {
        const keys = await redis.keys('exam:*');
        const examsAll = await redis.keys('exams:all:*');
        const allKeys = [...keys, ...examsAll];

        if (allKeys.length > 0) {
            await redis.del(...allKeys);
            console.log(`Successfully cleared ${allKeys.length} exam-related cache keys.`);
        } else {
            console.log('No exam-related cache keys found.');
        }
    } catch (err) {
        console.error('Error clearing cache:', err);
    } finally {
        redis.disconnect();
    }
}

clearExams();

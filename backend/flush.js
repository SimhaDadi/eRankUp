const Redis = require('ioredis');
const redis = new Redis();
redis.flushall().then(() => {
    console.log('Redis cleared successfully!');
    process.exit(0);
}).catch((e) => {
    console.error('Redis error:', e);
    process.exit(1);
});

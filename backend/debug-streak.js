const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'password',
    database: 'erankup_db',
});

async function run() {
    await client.connect();
    try {
        const userRes = await client.query(`
      SELECT 
        u.email, 
        u."createdAt" as "user_joined_at", 
        g."createdAt" as "gamification_started_at",
        g."lastActivityDate"
      FROM "user" u 
      LEFT JOIN user_gamification g ON u.id = g."userId" 
      WHERE u.email = 'dadi.ganesh1826@gmail.com';
    `);
        console.log('Timestamp Comparison:', userRes.rows);
    } catch (err) {
        console.error("Query failed:", err.message);
    } finally {
        await client.end();
    }
}

run();

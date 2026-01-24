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
    console.log('Connected to DB');

    try {
        // 1. Check if questions exist
        const questionCountReq = await client.query('SELECT COUNT(*) FROM question');
        console.log('Total Questions:', questionCountReq.rows[0].count);

        // 2. Simulate User Mastery Check (Cold Start)
        const userId = 'd87c9886-40f1-4f1a-b7b5-e2cd1b4956bd'; // Use a known user or mock
        const masteryReq = await client.query('SELECT * FROM user_topic_mastery WHERE "userId" = $1', [userId]);
        console.log('User Mastery Records:', masteryReq.rows.length);

        // 3. Simulate Logic: If mastery is 0, we expect "General Assessment"
        if (masteryReq.rows.length === 0) {
            console.log('Detected Cold Start. Fetching random questions...');

            // This is the raw SQL equivalent of TypeORM's orderBy('RANDOM()')
            const randomQ = await client.query(`
            SELECT id, content, topic 
            FROM question 
            ORDER BY RANDOM() 
            LIMIT 5
        `);
            console.log('Random Questions Found:', randomQ.rows.length);
            if (randomQ.rows.length > 0) {
                console.log('Sample:', randomQ.rows[0]);
            } else {
                console.log('CRITICAL: No questions found for "General Assessment"!');
            }
        } else {
            console.log('User has mastery. Checking weak areas...');
            // Logic for existing user...
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await client.end();
    }
}

run();

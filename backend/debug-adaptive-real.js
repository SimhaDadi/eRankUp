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
        const topic = 'General Assessment';
        console.log(`Testing query for topic: ${topic}`);

        // Simulate query builder behavior
        // .orderBy('RANDOM()') is what TypeORM builds
        // In Postgres, it is ORDER BY RANDOM()
        // Let's verify raw SQL works
        const res = await client.query(`
        SELECT q.id, q.content, s.title as subject
        FROM question q
        LEFT JOIN subject s ON q."subjectId" = s.id
        ORDER BY RANDOM()
        LIMIT 10
    `);
        console.log('Query success:', res.rows.length);
        console.log(res.rows[0]);

    } catch (err) {
        console.error("Query Failed:", err);
    } finally {
        await client.end();
    }
}

run();

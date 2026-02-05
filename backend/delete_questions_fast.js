
const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'password',
    database: 'erankup_db',
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Check count before
        const resCount = await client.query("SELECT COUNT(*) FROM question WHERE topic = 'Number Theory'");
        console.log(`Found ${resCount.rows[0].count} questions with topic 'Number Theory'.`);

        if (parseInt(resCount.rows[0].count) > 0) {
            const res = await client.query("DELETE FROM question WHERE topic = 'Number Theory'");
            console.log(`Deleted ${res.rowCount} questions.`);
        } else {
            console.log('No questions to delete.');
        }
    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

run();

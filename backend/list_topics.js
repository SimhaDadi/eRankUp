
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

        const res = await client.query("SELECT DISTINCT topic FROM question");
        console.log('Available Topics:', res.rows.map(r => r.topic));

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

run();

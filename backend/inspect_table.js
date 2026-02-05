
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

        // Inspect table
        const res = await client.query('SELECT * FROM "model_questions" LIMIT 1');
        console.log('Table columns:', res.fields.map(f => f.name));

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

run();

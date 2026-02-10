const { Client } = require('pg');
require('dotenv').config();

async function searchQuestions() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        // Search for keywords from the image
        const keywords = ['1-a', 'x varies inversely', 'a^2 - b^2', 'sqrt', 'x+y = 2z'];
        for (const kw of keywords) {
            console.log(`Searching for: ${kw}`);
            const res = await client.query('SELECT id, content FROM question WHERE content ILIKE $1', [`%${kw}%`]);
            console.log(`Results for ${kw}:`, res.rows.length);
            if (res.rows.length > 0) {
                console.log(JSON.stringify(res.rows, null, 2));
            }
        }
    } catch (err) {
        console.error('Database query error:', err.message);
    } finally {
        await client.end();
    }
}

searchQuestions();

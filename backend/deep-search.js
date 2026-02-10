const { Client } = require('pg');
require('dotenv').config();

async function deepSearch() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();

        // 1. Get full details of the question found
        const foundRes = await client.query("SELECT * FROM question WHERE content ILIKE '%x+y = 2z%'");
        console.log('--- Detailed Question #7 Analysis ---');
        console.log(JSON.stringify(foundRes.rows, null, 2));

        // 2. Search for Q1 specifically
        const q1Res = await client.query("SELECT id, content FROM question WHERE content ILIKE '%a/(1-a)%' OR content ILIKE '%value of 1/(1-a)%'");
        console.log('\n--- Q1 Search Results ---');
        console.log(JSON.stringify(q1Res.rows, null, 2));

        // 3. Search for Q10
        const q10Res = await client.query("SELECT id, content FROM question WHERE content ILIKE '%varies inversely%'");
        console.log('\n--- Q10 Search Results ---');
        console.log(JSON.stringify(q10Res.rows, null, 2));

        // 4. Search for Q2
        const q2Res = await client.query("SELECT id, content FROM question WHERE content ILIKE '%(3/5)^3%' OR content ILIKE '%(3/5)^{-6}%'");
        console.log('\n--- Q2 Search Results ---');
        console.log(JSON.stringify(q2Res.rows, null, 2));

    } catch (err) {
        console.error('Database query error:', err.message);
    } finally {
        await client.end();
    }
}

deepSearch();

const { Client } = require('pg');
require('dotenv').config();

async function exhaustiveCheck() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const patterns = [
        { num: 1, text: 'a/(1-a)' },
        { num: 2, text: '(3/5)^3' },
        { num: 3, text: '19' }, // a^2 - b^2 = 19
        { num: 4, text: 'sqrt{3}/2' },
        { num: 5, text: 'sqrt{x+4}' },
        { num: 6, text: '4\\sqrt{3}' },
        { num: 7, text: 'x+y = 2z' },
        { num: 8, text: 'a*b = a^b' },
        { num: 9, text: '97' }, // n + 2/3n... = 97
        { num: 10, text: 'varies inversely' }
    ];

    try {
        await client.connect();
        for (const p of patterns) {
            console.log(`Checking Question #${p.num} (pattern: ${p.text})`);
            const res = await client.query('SELECT id, content, options FROM question WHERE content ILIKE $1', [`%${p.text}%`]);
            if (res.rows.length > 0) {
                console.log(`[FOUND ${res.rows.length} matches]`);
                res.rows.forEach(r => {
                    console.log(`ID: ${r.id}`);
                    console.log(`Content: ${r.content}`);
                    // console.log(`Options: ${JSON.stringify(r.options)}`);
                });
            } else {
                console.log(`[NOT FOUND]`);
            }
            console.log('-------------------');
        }
    } catch (err) {
        console.error('Database query error:', err.message);
    } finally {
        await client.end();
    }
}

exhaustiveCheck();

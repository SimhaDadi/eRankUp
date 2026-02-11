const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function exhaustiveCheckToFile() {
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

    const results = [];

    try {
        await client.connect();
        for (const p of patterns) {
            const res = await client.query('SELECT id, content, options, explanation FROM question WHERE content ILIKE $1', [`%${p.text}%`]);
            results.push({
                num: p.num,
                pattern: p.text,
                foundCount: res.rows.length,
                matches: res.rows
            });
        }
        fs.writeFileSync('db-search-results.json', JSON.stringify(results, null, 2));
        console.log('Results saved to db-search-results.json');
    } catch (err) {
        console.error('Database query error:', err.message);
    } finally {
        await client.end();
    }
}

exhaustiveCheckToFile();

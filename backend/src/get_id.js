const { Client } = require('pg');
const dotenv = require('dotenv');
const { join } = require('path');
const fs = require('fs');

dotenv.config({ path: join(__dirname, '../.env') });

async function getFullId() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
    });

    await client.connect();

    const query = `
        SELECT q.id
        FROM question q
        LEFT JOIN chapter c ON q."chapterId" = c.id
        WHERE c.title ILIKE '%Time and Work%'
        AND q.content ILIKE '%x + 8%'
    `;

    const res = await client.query(query);
    if (res.rows.length > 0) {
        const id = res.rows[0].id;
        fs.writeFileSync('d:\\eRankUp\\backend\\q32_id.txt', id);
        console.log(`Full ID extracted to q32_id.txt: ${id}`);
    } else {
        console.log('Question not found.');
    }

    await client.end();
}

getFullId().catch(console.error);

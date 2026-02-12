const { Client } = require('pg');
const dotenv = require('dotenv');
const { join } = require('path');

dotenv.config({ path: join(__dirname, '../.env') });

async function checkQuestionMetadata() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
    });

    await client.connect();

    const query = `
        SELECT id, content, options, "correctOptionId"
        FROM question
        WHERE id::text LIKE '379acf93-bec1-4fe3-a35b-c2c5b98%'
    `;

    const res = await client.query(query);

    res.rows.forEach(row => {
        console.log(`\nQUESTION [${row.id}]:`);
        console.log(`Options: ${JSON.stringify(row.options, null, 2)}`);
        console.log(`Correct Option ID: ${row.correctOptionId}`);
    });

    await client.end();
}

checkQuestionMetadata().catch(console.error);

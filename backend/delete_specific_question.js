
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

        // Search for the specific questions
        const query = "SELECT id, content FROM question WHERE content LIKE '%A fraction becomes 1/3%'";
        const res = await client.query(query);
        console.log(`Found ${res.rowCount} matching questions.`);

        if (res.rowCount > 0) {
            const ids = res.rows.map(r => r.id);
            const idList = ids.map(id => `'${id}'`).join(',');

            res.rows.forEach(r => console.log(`- ${r.id}: ${r.content.substring(0, 50)}...`));

            // 1. Delete from junction table
            console.log('Unlinking from model_questions...');
            const unlinkRes = await client.query(`DELETE FROM "model_questions" WHERE "questionId" IN (${idList})`);
            console.log(`Removed ${unlinkRes.rowCount} links.`);

            // 2. Delete the questions
            console.log('Deleting questions...');
            const delRes = await client.query(`DELETE FROM question WHERE id IN (${idList})`);
            console.log(`Deleted ${delRes.rowCount} questions.`);
        } else {
            console.log("No matching questions found.");
        }

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

run();

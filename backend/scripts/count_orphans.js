const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function countOrphans() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'erankup_db',
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        // Count orphans
        // Logic: No link in exam_questions_question AND no link in model_questions_question AND chapterId is NULL
        const query = `
            SELECT count(*)
            FROM question q
            LEFT JOIN exam_questions_question eq ON q.id = eq."questionId"
            LEFT JOIN model_questions mq ON q.id = mq."questionId"
            WHERE eq."questionId" IS NULL
              AND mq."questionId" IS NULL
              AND q."chapterId" IS NULL;
        `;

        const res = await client.query(query);
        console.log('Query Result:', res.rows);
        const count = res.rows[0].count;
        console.log(`Found ${count} orphaned questions (Unlinked from everything).`);

        if (parseInt(count) > 0) {
            console.log('To delete them, run the delete script: node scripts/delete_orphans.js');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

countOrphans();

const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function diagnose() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'erankup_db',
    });

    try {
        await client.connect();

        // 1. Total Count
        const resTotal = await client.query('SELECT count(*) FROM question');
        console.log(`\n--- DIAGNOSIS REPORT ---`);
        console.log(`Total Questions in DB: ${resTotal.rows[0].count}`);

        if (parseInt(resTotal.rows[0].count) === 0) {
            console.log("Database is empty. Frontend might be caching?");
            return;
        }

        // 2. Breakdown by connections
        // Linked to Models
        const resModels = await client.query('SELECT count(DISTINCT "questionId") FROM model_questions');
        console.log(`Linked to Models: ${resModels.rows[0].count}`);

        // Linked to Exams
        const resExams = await client.query('SELECT count(DISTINCT "questionId") FROM exam_questions_question');
        console.log(`Linked to Exams: ${resExams.rows[0].count}`);

        // Linked to Chapters (Direct column)
        const resChapters = await client.query('SELECT count(*) FROM question WHERE "chapterId" IS NOT NULL');
        console.log(`Linked to Chapters (chapterId column): ${resChapters.rows[0].count}`);

        // Linked to Subjects (Direct column)
        const resSubjects = await client.query('SELECT count(*) FROM question WHERE "subjectId" IS NOT NULL');
        // Note: subjectId might not exist on question entity directly, but let's check based on previous entity file view logic if needed. 
        // Wait, I saw entity file. It has @ManyToOne subject. So it has subjectId.
        console.log(`Linked to Subjects (subjectId column): ${resSubjects.rows[0].count}`);

        // 3. Find "Stubborn" Orphans
        console.log(`\n--- DETAILS OF REMAINING QUESTIONS ---`);
        const sample = await client.query(`
            SELECT q.id, mq."modelId", m.title as "modelTitle", m."chapterId" as "modelChapterId"
            FROM question q
            LEFT JOIN model_questions mq ON q.id = mq."questionId"
            LEFT JOIN model m ON mq."modelId" = m.id
            LIMIT 5
        `);
        console.log(JSON.stringify(sample.rows, null, 2));

        // Check for Models without Chapters (Phantom Models)
        const phantomModels = await client.query(`
            SELECT id, title, "chapterId"
            FROM model
            WHERE "chapterId" IS NULL
        `);

        console.log(`\nPhantom Models (Models with no Chapter): ${phantomModels.rowCount}`);
        if (phantomModels.rowCount > 0) {
            console.log(JSON.stringify(phantomModels.rows, null, 2));
            console.log("These models exist but contain questions. Since they have no Chapter, they don't show in the UI.");
        }

        // Check if models exist
        const ghostModels = await client.query(`
            SELECT DISTINCT mq."modelId"
            FROM model_questions mq
            LEFT JOIN model m ON mq."modelId" = m.id
            WHERE m.id IS NULL
        `);

        console.log(`\nGhost Models (Links to non-existent models): ${ghostModels.rowCount}`);
        if (ghostModels.rowCount > 0) {
            console.log(ghostModels.rows);
        }

        // 4. Check if hierarchy parents exist
        const resChapterCount = await client.query('SELECT count(*) FROM chapter');
        console.log(`\nTotal Chapters in DB: ${resChapterCount.rows[0].count}`);

        const resSubjectCount = await client.query('SELECT count(*) FROM subject');
        console.log(`Total Subjects in DB: ${resSubjectCount.rows[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

diagnose();

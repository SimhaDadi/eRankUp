const { Client } = require('pg');
const dotenv = require('dotenv');
const { join } = require('path');

dotenv.config({ path: join(__dirname, '../../.env') });

async function generateTestExplanations() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
    });

    await client.connect();
    console.log('[Test] Connected to DB.\n');

    // Get one question from each available chapter
    const query = `
        SELECT DISTINCT c.title as chapter_title, c.id as chapter_id
        FROM chapter c
        INNER JOIN question q ON q."chapterId" = c.id
        WHERE c.title IS NOT NULL
        ORDER BY c.title
    `;

    const chaptersResult = await client.query(query);

    console.log('='.repeat(80));
    console.log(`Found ${chaptersResult.rows.length} chapters with questions`);
    console.log('='.repeat(80));

    const testPlan = [];

    for (const chapter of chaptersResult.rows) {
        // Get one question from this chapter that doesn't have an explanation yet
        const questionQuery = `
            SELECT q.id, q.content, c.title as chapter_title
            FROM question q
            LEFT JOIN chapter c ON q."chapterId" = c.id
            LEFT JOIN question_explanation qe ON q.id = qe."questionId"
            WHERE c.id = $1 AND qe."aiExplanation" IS NULL
            LIMIT 1
        `;

        const questionResult = await client.query(questionQuery, [chapter.chapter_id]);

        if (questionResult.rows.length > 0) {
            const q = questionResult.rows[0];
            testPlan.push({
                chapter: chapter.chapter_title,
                questionId: q.id,
                questionPreview: q.content.substring(0, 100) + '...'
            });
        }
    }

    console.log('\n📋 TEST PLAN - Questions to Generate Explanations For:\n');
    testPlan.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.chapter}`);
        console.log(`   Question ID: ${item.questionId}`);
        console.log(`   Preview: ${item.questionPreview}\n`);
    });

    console.log('='.repeat(80));
    console.log('NEXT STEPS:');
    console.log('='.repeat(80));
    console.log('1. Go to Admin Dashboard → AI Explanations');
    console.log('2. For each chapter above, find the question by ID');
    console.log('3. Click "Generate Explanation"');
    console.log('4. Verify it uses the shortcut format (direct numbers, no algebra)');
    console.log('5. After testing 5-6 chapters, run verify_all_chapters.js again');
    console.log('\nOR run the bulk generation script to auto-generate all at once.');

    await client.end();
}

generateTestExplanations().catch(console.error);

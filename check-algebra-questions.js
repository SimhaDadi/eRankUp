const { Client } = require('pg');

const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'erankup_db',
    password: 'password',
    port: 5432,
});

async function run() {
    await client.connect();

    // Find Algebra chapter
    const chapterRes = await client.query(`
    SELECT id, title FROM chapter WHERE title ILIKE '%Algebra%'
  `);

    if (chapterRes.rows.length === 0) {
        console.log('No Algebra chapter found.');
        await client.end();
        return;
    }

    const algebraChapterId = chapterRes.rows[0].id;
    console.log(`Algebra Chapter ID: ${algebraChapterId}`);

    // Find questions in this chapter
    const questionsRes = await client.query(`
    SELECT id, content, "correctOptionId", options, explanation 
    FROM question 
    WHERE "chapterId" = $1
    LIMIT 15;
  `, [algebraChapterId]);

    console.log('Questions found:');
    console.log(JSON.stringify(questionsRes.rows, null, 2));

    await client.end();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

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
    const res = await client.query(`
    SELECT m.id, m.title, COUNT(mqq."questionId") as question_count
    FROM models m
    LEFT JOIN model_questions_question mqq ON m.id = mqq."modelId"
    GROUP BY m.id, m.title
    ORDER BY question_count DESC;
  `);

    console.log('ID | Title | Count');
    console.log('---|---|---');
    res.rows.forEach(row => {
        console.log(`${row.id} | ${row.title} | ${row.question_count}`);
    });

    await client.end();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

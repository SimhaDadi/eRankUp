
const { Client } = require('pg');

async function check() {
    const client = new Client({
        user: 'admin',
        host: 'localhost',
        database: 'erankup_db',
        password: 'password',
        port: 5432,
    });
    try {
        await client.connect();

        const examId = 'f94d3cde-bcac-4628-b637-f0940ce00104';
        const modelId = '156700c1-1edc-4f75-a33c-f1a67d952766';

        const examQ = await client.query('SELECT count(*) FROM exam_questions_question WHERE "examId" = $1', [examId]);
        const modelQ = await client.query('SELECT count(*) FROM model_questions WHERE "modelId" = $1', [modelId]);

        console.log(`Exam Q count: ${examQ.rows[0].count}`);
        console.log(`Model Q count: ${modelQ.rows[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();

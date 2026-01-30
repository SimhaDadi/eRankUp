
const { createConnection } = require('typeorm');
const path = require('path');

async function check() {
    try {
        const conn = await createConnection({
            type: 'postgres',
            url: 'postgresql://postgres:postgres@localhost:5432/erankup',
            entities: [
                path.join(__dirname, 'dist/backend/src/**/*.entity.js')
            ],
            synchronize: false,
        });

        const exams = await conn.query('SELECT id, title, "isPublished", "isPremium" FROM exam');
        console.log('--- EXAMS ---');
        exams.forEach(e => console.log(`Exam: [${e.id}] ${e.title} (Published: ${e.isPublished}, Premium: ${e.isPremium})`));

        const models = await conn.query('SELECT id, title FROM model');
        console.log('--- MODELS ---');
        models.forEach(m => console.log(`Model: [${m.id}] ${m.title}`));

        const questionCount = await conn.query('SELECT COUNT(*) FROM question');
        console.log('Total Questions:', questionCount[0].count);

        await conn.close();
    } catch (err) {
        console.error(err);
    }
}
check();

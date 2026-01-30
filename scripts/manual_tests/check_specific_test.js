
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

        const exams = await conn.query("SELECT id, title, \"isPublished\", \"isPremium\" FROM exam WHERE title LIKE '%Sample Model Test 2%'");
        console.log('--- EXAMS ---');
        exams.forEach(e => console.log(`Exam: [${e.id}] ${e.title} (Published: ${e.isPublished}, Premium: ${e.isPremium})`));

        const models = await conn.query("SELECT id, title FROM model WHERE title LIKE '%Sample Model Test 2%'");
        console.log('--- MODELS ---');
        models.forEach(m => console.log(`Model: [${m.id}] ${m.title}`));

        // Check if they are linked
        if (exams.length > 0 && models.length > 0) {
            const links = await conn.query('SELECT * FROM exam_models WHERE "examId" = $1 OR "modelId" = $2', [exams[0].id, models[0].id]);
            console.log('--- LINKS ---');
            links.forEach(l => console.log(`Link: Exam ${l.examId} <-> Model ${l.modelId}`));
        }

        await conn.close();
    } catch (err) {
        console.error(err);
    }
}
check();

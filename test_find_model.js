
const { createConnection } = require('typeorm');
const path = require('path');

async function test() {
    try {
        const conn = await createConnection({
            type: 'postgres',
            url: 'postgresql://postgres:postgres@localhost:5432/erankup',
            entities: [
                path.join(__dirname, 'dist/backend/src/**/*.entity.js')
            ],
            synchronize: false,
        });

        // Mock ExamsService
        const examRepo = conn.getRepository(path.join(__dirname, 'dist/backend/src/exams/entities/exam.entity.js').replace('.js', ''));
        const modelRepo = conn.getRepository(path.join(__dirname, 'dist/backend/src/exams/entities/model.entity.js').replace('.js', ''));

        const examId = 'f94d3cde-bcac-4628-b637-f0940ce00104';
        const modelId = '156700c1-1edc-4f75-a33c-f1a67d952766';

        async function findModel(id) {
            console.log(`Testing findModel for ID: ${id}`);
            let model = await conn.query('SELECT * FROM model WHERE id = $1', [id]);
            if (model.length === 0) {
                console.log('Not found in model table, trying exam table...');
                const exam = await conn.query('SELECT * FROM exam WHERE id = $1', [id]);
                if (exam.length > 0) {
                    console.log('Found in exam table!');
                    return { id: exam[0].id, title: exam[0].title, isFallback: true };
                }
            } else {
                console.log('Found in model table!');
                return model[0];
            }
            return null;
        }

        const res1 = await findModel(modelId);
        console.log('Result for Model ID:', res1 ? res1.title : 'NULL');

        const res2 = await findModel(examId);
        console.log('Result for Exam ID:', res2 ? res2.title : 'NULL');

        await conn.close();
    } catch (err) {
        console.error(err);
    }
}
test();


const { Client } = require('pg');

async function test() {
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

        async function findModel(id) {
            console.log(`Testing findModel for ID: ${id}`);
            const modelRes = await client.query('SELECT * FROM model WHERE id = $1', [id]);
            if (modelRes.rows.length === 0) {
                console.log('Not found in model table, trying exam table...');
                const examRes = await client.query('SELECT * FROM exam WHERE id = $1', [id]);
                if (examRes.rows.length > 0) {
                    console.log('Found in exam table!');
                    return { id: examRes.rows[0].id, title: examRes.rows[0].title, isFallback: true };
                }
            } else {
                console.log('Found in model table!');
                return modelRes.rows[0];
            }
            return null;
        }

        const res1 = await findModel(modelId);
        console.log('Result for Model ID:', res1 ? res1.title : 'NULL');

        const res2 = await findModel(examId);
        console.log('Result for Exam ID:', res2 ? res2.title : 'NULL');

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
test();

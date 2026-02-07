const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function cleanUpPhantoms() {
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

        // ---------------------------------------------------------
        // PHASE 1: Detect Phantom Models (Models with no Chapter)
        // ---------------------------------------------------------
        const phantomModelsQuery = `
            SELECT id, title, "totalQuestions"
            FROM model
            WHERE "chapterId" IS NULL;
        `;
        const phantomModelsRes = await client.query(phantomModelsQuery);
        const phantomModelsCount = phantomModelsRes.rowCount;

        console.log(`\n--- PHASE 1: Phantom Models ---`);
        console.log(`Found ${phantomModelsCount} models with NO Chapter (Invisible in Hierarchy).`);
        if (phantomModelsCount > 0) {
            console.log('Sample:', phantomModelsRes.rows.slice(0, 3));
        }

        // ---------------------------------------------------------
        // PHASE 2: Detect Orphaned Questions (Unlinked from everything)
        // ---------------------------------------------------------

        // Note: We check this BEFORE deleting models to see what is currently truly orphaned.
        // After deleting phantom models, MORE questions will become orphaned.

        const countOrphansQuery = `
            SELECT count(*)
            FROM question q
            LEFT JOIN exam_questions_question eq ON q.id = eq."questionId"
            LEFT JOIN model_questions mq ON q.id = mq."questionId"
            WHERE eq."questionId" IS NULL
              AND mq."questionId" IS NULL
              AND q."chapterId" IS NULL;
        `;
        const resOrphans = await client.query(countOrphansQuery);
        const initialOrphanCount = parseInt(resOrphans.rows[0].count);

        console.log(`\n--- PHASE 2: Orphaned Questions ---`);
        console.log(`Found ${initialOrphanCount} questions currently unlinked from everything.`);


        if (phantomModelsCount === 0 && initialOrphanCount === 0) {
            console.log('\nAll clean! No phantoms or orphans found.');
            await client.end();
            return;
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\nDo you want to DELETE these Phantom Models and CLEAN UP the resulting orphaned questions? (yes/no): ', async (answer) => {
            if (answer.toLowerCase() === 'yes') {

                // 1. Delete Phantom Models
                if (phantomModelsCount > 0) {
                    console.log('Deleting Phantom Models...');
                    // Delete the models. The references in model_questions should cascade or be removed if defined, 
                    // but usually ManyToMany requires manual cleanup OR cascade.
                    // Let's assume standard Delete.

                    // We must delete from model_questions join table first just in case cascade isn't auto
                    // Actually, if we delete the model, TypeORM/PG usually handles join table if set up right.
                    // But let's be safe and delete using the IDs.

                    const modelIds = phantomModelsRes.rows.map(m => m.id);
                    // Safe string injection for IDs (better to use params but this is a script)
                    const idList = modelIds.map(id => `'${id}'`).join(",");

                    // 1a. Clear dependencies in model_questions
                    if (idList) {
                        await client.query(`DELETE FROM model_questions WHERE "modelId" IN (${idList})`);
                        await client.query(`DELETE FROM model WHERE id IN (${idList})`);
                        console.log(`Deleted ${phantomModelsCount} Phantom Models.`);
                    }
                }

                // 2. Re-Count and Delete All Orphans (New + Old)
                console.log('Scanning for all orphans (including newly released ones)...');

                // We use the DELETE ... RETURNING * logic to do it in one shot and count
                const deleteOrphansQuery = `
                    DELETE FROM question
                    WHERE id IN (
                        SELECT q.id
                        FROM question q
                        LEFT JOIN exam_questions_question eq ON q.id = eq."questionId"
                        LEFT JOIN model_questions mq ON q.id = mq."questionId"
                        WHERE eq."questionId" IS NULL
                          AND mq."questionId" IS NULL
                          AND q."chapterId" IS NULL
                    )
                    RETURNING id;
                `;

                const deleteRes = await client.query(deleteOrphansQuery);
                console.log(`SUCCESS: Deleted ${deleteRes.rowCount} Orphaned Questions.`);

            } else {
                console.log('Aborted.');
            }
            rl.close();
            await client.end();
        });

    } catch (err) {
        console.error('Error:', err);
        await client.end();
    }
}

cleanUpPhantoms();

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'erankup_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function resetCorrectOptions() {
    try {
        await client.connect();
        console.log('Connected to database successfully.');

        const query = "UPDATE question SET \"correctOptionId\" = 'UNKNOWN';";
        const res = await client.query(query);
        console.log(`Success! Updated ${res.rowCount} questions. all correctOptionId set to 'UNKNOWN'.`);

        // Also clear existing logical check outcomes from question_explanation to force fresh verification
        const clearExplanQuery = 'UPDATE question_explanation SET "isLogicalMismatch" = false, "logicalSolveOutcome" = NULL;';
        const res2 = await client.query(clearExplanQuery);
        console.log(`Success! Reset logical flags for ${res2.rowCount} explanation records.`);

    } catch (err) {
        console.error('Error executing query:', err.stack);
    } finally {
        await client.end();
    }
}

resetCorrectOptions();

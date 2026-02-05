
require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // ssl: { rejectUnauthorized: false }, // Local DB usually no SSL
    synchronize: false
});

async function inspect() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");

        // Using raw query to avoid needing entity definitions in the script
        const questions = await AppDataSource.query(`
            SELECT id, content, options, "correctOptionId", explanation
            FROM question 
            WHERE content ILIKE '%vary%'
            LIMIT 5
        `);
        console.log("Found:", questions.length);

        console.log("--- Latest Questions ---");
        questions.forEach((q, i) => {
            console.log(`\n[${i + 1}] ID: ${q.id}`);
            console.log(`CONTENT: ${q.content}`);
            console.log(`OPTIONS: ${JSON.stringify(q.options)}`);
            console.log(`CORRECT ID: ${q.correctOptionId}`);
            // console.log(`EXPLAIN: ${q.explanation}`); // Optional, can be long
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await AppDataSource.destroy();
    }
}

inspect();

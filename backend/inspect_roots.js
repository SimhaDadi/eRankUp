
require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // ssl: { rejectUnauthorized: false }, 
    synchronize: false
});

async function fixAsterisks() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");

        const questions = await AppDataSource.query(`
            SELECT id, content FROM question 
            WHERE content ILIKE '%If x = 2%' OR content ILIKE '%√%'
            LIMIT 10
        `);

        console.log(`Found ${questions.length} questions to fix.`);

        for (const q of questions) {
            const cleanContent = q.content.replace(/\*/g, ''); // Remove all asterisks
            await AppDataSource.query(`
                UPDATE question SET content = $1 WHERE id = $2
            `, [cleanContent, q.id]);
            console.log(`Fixed: ${q.id}: ${cleanContent.substring(0, 50)}...`);
        }
        console.log("Cleanup complete.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await AppDataSource.destroy();
    }
}

fixAsterisks();


require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    //    ssl: { rejectUnauthorized: false }, 
    synchronize: false
});

async function inspectAlgebra() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");

        // 1. Find Algebra Chapter
        const chapters = await AppDataSource.query(`
            SELECT id, title FROM chapter 
            WHERE title ILIKE '%Algebra%'
            LIMIT 5
        `);

        if (chapters.length === 0) {
            console.log("❌ No 'Algebra' chapter found.");
            return;
        }

        console.log("Found Chapters:", chapters);

        // 2. Find Questions for these chapters
        for (const chap of chapters) {
            console.log(`\n--- Inspecting Chapter: ${chap.title} (${chap.id}) ---`);
            const questionsCorrect = await AppDataSource.query(`
                SELECT id, content, options, "correctOptionId", explanation
                FROM question 
                WHERE "chapterId" = '${chap.id}'
                LIMIT 20
            `);

            if (questionsCorrect.length === 0) {
                console.log("   (No questions found in this chapter)");
            }

            questionsCorrect.forEach((q, i) => {
                console.log(`\n[${i + 1}] ${q.content.substring(0, 150)}...`);
                console.log(`    Options: ${JSON.stringify(q.options)}`);
                console.log(`    Correct: ${q.correctOptionId}`);
            });

            // Specific search for the user's issue content
            const specific = await AppDataSource.query(`
                SELECT id, content FROM question 
                WHERE "chapterId" = '${chap.id}' AND content ILIKE '%vary%'
            `);
            if (specific.length > 0) {
                console.log(`\n!!! FOUND SPECIFIC QUESTION (${specific.length}) !!!`);
                console.log(specific[0].content);
            } else {
                console.log("\n(Specific 'vary' question NOT found in this chapter)");
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await AppDataSource.destroy();
    }
}

inspectAlgebra();

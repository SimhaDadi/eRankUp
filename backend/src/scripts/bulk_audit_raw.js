const { Client } = require('pg');
const dotenv = require('dotenv');
const { join } = require('path');
const Groq = require('groq-sdk');
const fs = require('fs');

dotenv.config({ path: join(__dirname, '../../.env') });

const BATCH_SIZE = 5;
const LIMIT = 10; // Let's start with 10 for the user to verify

async function runBulkAuditRaw() {
    console.log('--- [AI Bulk Audit RAW] Initializing ---');

    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
    });

    try {
        await client.connect();
        console.log('[Audit] Connected to DB.');
    } catch (dbError) {
        console.error('[Audit] FATAL: Database connection failed.');
        console.error(dbError);
        process.exit(1);
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const modelName = 'llama-3.3-70b-versatile';

    console.log(`[Audit] Fetching questions... (Limit: ${LIMIT})`);

    const query = `
        SELECT q.id, q.content, q.options, q."correctOptionId", c.title as chapter_title
        FROM question q
        LEFT JOIN chapter c ON q."chapterId" = c.id
        ORDER BY q."createdAt" DESC
        LIMIT ${LIMIT}
    `;

    const res = await client.query(query);
    const questions = res.rows;
    console.log(`[Audit] Found ${questions.length} questions to audit.`);

    const report = {
        scanTime: new Date().toISOString(),
        totalAudited: questions.length,
        discrepancies: [],
        stats: {
            matches: 0,
            mismatches: 0,
            errors: 0
        }
    };

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        console.log(`[Audit] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        await Promise.all(batch.map(async (q) => {
            try {
                // Parse options if they are stringified JSON (TypeORM handles this, pg doesn't always)
                const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

                const prompt = `Solve the following Multiple Choice Question (MCQ) mathematically from scratch. 
                
                QUESTION:
                ${q.content}
                
                OPTIONS:
                ${options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt.text}`).join('\n')}
                
                TASK:
                1. Solve the problem step-by-step.
                2. Identify which option (A, B, C, or D) is correct.
                
                RESPONSE FORMAT (JSON ONLY):
                {
                    "reasoning": "your step by step calculation",
                    "correctOption": "A" | "B" | "C" | "D"
                }`;

                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: modelName,
                    temperature: 0.1,
                    response_format: { type: 'json_object' }
                });

                const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');
                const aiAnswer = aiResponse.correctOption?.toUpperCase();
                const dbAnswer = q.correctOptionId?.toUpperCase();

                if (aiAnswer === dbAnswer) {
                    report.stats.matches++;
                } else {
                    console.warn(`[Mismatch Found] Q-ID: ${q.id} | DB Says: ${dbAnswer} | AI Calculated: ${aiAnswer}`);
                    report.stats.mismatches++;
                    report.discrepancies.push({
                        id: q.id,
                        content: q.content,
                        dbAnswer,
                        aiAnswer,
                        reasoning: aiResponse.reasoning,
                        chapter: q.chapter_title
                    });
                }
            } catch (err) {
                console.error(`[Error] Auditing Question ${q.id}:`, err.message);
                report.stats.errors++;
            }
        }));
    }

    const reportPath = join(__dirname, '../../audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n--- [AI Bulk Audit] COMPLETE ---');
    console.log(`Total Audited: ${report.totalAudited}`);
    console.log(`Matches: ${report.stats.matches}`);
    console.log(`Discrepancies: ${report.stats.mismatches}`);
    console.log(`Errors: ${report.stats.errors}`);
    console.log(`Report saved to: ${reportPath}`);

    await client.end();
}

runBulkAuditRaw().catch(console.error);

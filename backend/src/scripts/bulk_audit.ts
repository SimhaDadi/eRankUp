import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Question } from '../exams/entities/question.entity';
import { Subject } from '../exams/entities/subject.entity';
import { Chapter } from '../exams/entities/chapter.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';
import Groq from 'groq-sdk';
import * as fs from 'fs';

dotenv.config({ path: join(__dirname, '../../.env') });

const BATCH_SIZE = 2; // Reduced to avoid hitting rate limits while testing
const LIMIT = 5; // Small limit for verification

async function runBulkAudit() {
    console.log('--- [AI Bulk Audit] Initializing ---');

    console.log(`[Audit] DB Config: host=${process.env.DB_HOST}, user=${process.env.DB_USER}, db=${process.env.DB_NAME}`);

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
        entities: [Question, Subject, Chapter],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
    } catch (dbError) {
        console.error('[Audit] FATAL: Database initialization failed.');
        console.error(dbError);
        process.exit(1);
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const modelName = 'llama-3.3-70b-versatile';

    console.log(`[Audit] Fetching questions... (Limit: ${LIMIT || 'Unlimited'})`);
    const questionRepo = dataSource.getRepository(Question);

    const queryBuilder = questionRepo.createQueryBuilder('q')
        .leftJoinAndSelect('q.chapter', 'chapter')
        .orderBy('q.createdAt', 'DESC');

    if (LIMIT > 0) {
        queryBuilder.limit(LIMIT);
    }

    const questions = await queryBuilder.getMany();
    console.log(`[Audit] Found ${questions.length} questions to audit.`);

    const report = {
        scanTime: new Date().toISOString(),
        totalAudited: questions.length,
        discrepancies: [] as any[],
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
                const prompt = `Solve the following Multiple Choice Question (MCQ) mathematically from scratch. 
                
                QUESTION:
                ${q.content}
                
                OPTIONS:
                ${q.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt.text}`).join('\n')}
                
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
                        chapter: q.chapter?.title,
                        topic: q.topic
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

    await dataSource.destroy();
}

runBulkAudit().catch(console.error);

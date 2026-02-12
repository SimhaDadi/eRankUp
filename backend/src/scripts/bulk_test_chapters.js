const { Client } = require('pg');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const { join } = require('path');
const fs = require('fs');

dotenv.config({ path: join(__dirname, '../../.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function bulkTestChapters() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
    });

    await client.connect();
    console.log('[Bulk Test] Connected to DB.\n');

    // Get all chapters with questions
    const chaptersQuery = `
        SELECT DISTINCT c.id, c.title
        FROM chapter c
        INNER JOIN question q ON q."chapterId" = c.id
        WHERE c.title IS NOT NULL
        ORDER BY c.title
        LIMIT 10
    `;

    const chaptersResult = await client.query(chaptersQuery);
    console.log(`[Bulk Test] Found ${chaptersResult.rows.length} chapters to test\n`);

    const results = {
        timestamp: new Date().toISOString(),
        totalChapters: chaptersResult.rows.length,
        passed: [],
        failed: [],
        errors: []
    };

    for (const chapter of chaptersResult.rows) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📚 Testing Chapter: ${chapter.title}`);
        console.log('='.repeat(80));

        try {
            // Get one question from this chapter
            const questionQuery = `
                SELECT q.id, q.content, q.options, q."correctOptionId"
                FROM question q
                WHERE q."chapterId" = $1
                LIMIT 1
            `;

            const questionResult = await client.query(questionQuery, [chapter.id]);

            if (questionResult.rows.length === 0) {
                console.log('   ⚠️  No questions found');
                continue;
            }

            const question = questionResult.rows[0];
            const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;

            console.log(`   Question ID: ${question.id}`);
            console.log(`   Preview: ${question.content.substring(0, 100)}...`);

            // Build the explanation prompt (simplified version from ExplanationService)
            const prompt = `You are an expert SSC CGL Quant mentor known for "Extreme Shortcut Mode".

### STRICTLY FORBIDDEN - NO ALGEBRA:
❌ NEVER write: "Let x be...", "Assume...", "$x = \\\\sqrt{(x+8)(x+18)}$"
❌ NEVER use variables in formulas. Use DIRECT NUMBERS ONLY.
✅ ALWAYS write: "$x = \\\\sqrt{8 \\\\times 18} = 12$ days" (direct calculation)

### Question:
${question.content}

### Options:
${options.map((opt, idx) => `${opt.id}) ${opt.text}`).join('\n')}

### Correct Answer: ${question.correctOptionId}

Write a concise explanation using:
**1. Extreme Shortcut Solution** 🚀
- Max 3 steps with direct numbers only
- Use arrows (→) instead of sentences

**2. Ranker's Hack** 🔥
- Quick mental math trick`;

            console.log('   🤖 Generating explanation...');

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3
            });

            const explanation = completion.choices[0]?.message?.content || '';

            // Verify the explanation
            const hasAlgebra =
                explanation.includes('Let x be') ||
                explanation.includes('Assume') ||
                /\$x\s*=\s*\\sqrt\{?\([^0-9]/.test(explanation); // Algebraic sqrt with variables

            const hasShortcut =
                explanation.includes('Extreme Shortcut') ||
                /\$\d+\s*\\times\s*\d+/.test(explanation) || // Direct numbers
                explanation.includes('→');

            if (hasAlgebra) {
                console.log('   ❌ FAILED: Contains algebraic derivations');
                console.log(`   Sample: ${explanation.substring(0, 200)}...`);
                results.failed.push({
                    chapter: chapter.title,
                    questionId: question.id,
                    reason: 'Contains algebra',
                    sample: explanation.substring(0, 300)
                });
            } else if (hasShortcut) {
                console.log('   ✅ PASSED: Uses shortcut format');
                results.passed.push(chapter.title);
            } else {
                console.log('   ⚠️  WARNING: Format unclear');
                results.failed.push({
                    chapter: chapter.title,
                    questionId: question.id,
                    reason: 'Unclear format',
                    sample: explanation.substring(0, 300)
                });
            }

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.errors.push({
                chapter: chapter.title,
                error: error.message
            });
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save results
    const reportPath = join(__dirname, '../../bulk_test_results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('BULK TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${results.passed.length}/${results.totalChapters}`);
    console.log(`❌ Failed: ${results.failed.length}/${results.totalChapters}`);
    console.log(`⚠️  Errors: ${results.errors.length}/${results.totalChapters}`);

    if (results.passed.length > 0) {
        console.log('\n✅ Chapters with Correct Shortcut Format:');
        results.passed.forEach(ch => console.log(`   - ${ch}`));
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Chapters with Issues:');
        results.failed.forEach(item => console.log(`   - ${item.chapter}: ${item.reason}`));
    }

    console.log(`\n📄 Full report saved to: ${reportPath}`);

    await client.end();
}

bulkTestChapters().catch(console.error);

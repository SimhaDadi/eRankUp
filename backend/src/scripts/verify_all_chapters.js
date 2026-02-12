const { Client } = require('pg');
const dotenv = require('dotenv');
const { join } = require('path');
const fs = require('fs');

dotenv.config({ path: join(__dirname, '../../.env') });

async function verifyAllChapters() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
    });

    await client.connect();
    console.log('[Verify] Connected to DB.\n');

    // Target chapters to verify
    const targetChapters = [
        'Time and Work',
        'Averages',
        'Profit and Loss',
        'Ratio and Proportion',
        'Number System',
        'Geometry',
        'Trigonometry',
        'Simple Interest and Compound Interest',
        'Time and Distance',
        'Mensuration',
        'Algebra',
        'Percentage'
    ];

    const report = {
        timestamp: new Date().toISOString(),
        totalChapters: targetChapters.length,
        verified: [],
        issues: [],
        notFound: []
    };

    console.log('='.repeat(80));
    console.log('CHAPTER-BY-CHAPTER VERIFICATION');
    console.log('='.repeat(80));

    for (const chapterName of targetChapters) {
        console.log(`\n📚 Checking: ${chapterName}`);

        // Find one question from this chapter
        const query = `
            SELECT q.id, q.content, c.title as chapter_title, qe."aiExplanation"
            FROM question q
            LEFT JOIN chapter c ON q."chapterId" = c.id
            LEFT JOIN question_explanation qe ON q.id = qe."questionId"
            WHERE c.title ILIKE $1
            LIMIT 1
        `;

        const result = await client.query(query, [`%${chapterName}%`]);

        if (result.rows.length === 0) {
            console.log(`   ⚠️  No questions found for this chapter`);
            report.notFound.push(chapterName);
            continue;
        }

        const question = result.rows[0];
        const explanation = question.aiExplanation;

        if (!explanation) {
            console.log(`   ℹ️  Question found but no explanation generated yet`);
            console.log(`   Question ID: ${question.id}`);
            report.issues.push({
                chapter: chapterName,
                issue: 'No explanation generated',
                questionId: question.id
            });
            continue;
        }

        // Check for algebraic patterns (BAD)
        const hasAlgebra =
            explanation.includes('Let x be') ||
            explanation.includes('Assume') ||
            /\$x\s*=\s*\\sqrt\{?\(/.test(explanation) || // Matches $x = \sqrt{(x+8)...
            /\\frac\{1\}\{x\}/.test(explanation); // Matches \frac{1}{x}

        // Check for shortcut patterns (GOOD)
        const hasShortcut =
            explanation.includes('Extreme Shortcut') ||
            explanation.includes('Ranker\'s Hack') ||
            /\$\d+\s*\\times\s*\d+/.test(explanation) || // Matches direct numbers like $8 \times 18
            explanation.includes('→') ||
            explanation.includes('\\rightarrow');

        if (hasAlgebra) {
            console.log(`   ❌ ISSUE: Contains algebraic derivations`);
            console.log(`   First 200 chars: ${explanation.substring(0, 200)}...`);
            report.issues.push({
                chapter: chapterName,
                issue: 'Contains algebra',
                questionId: question.id,
                sample: explanation.substring(0, 200)
            });
        } else if (hasShortcut) {
            console.log(`   ✅ VERIFIED: Uses shortcut format`);
            report.verified.push(chapterName);
        } else {
            console.log(`   ⚠️  WARNING: Format unclear (no algebra but no clear shortcut markers)`);
            console.log(`   First 200 chars: ${explanation.substring(0, 200)}...`);
            report.issues.push({
                chapter: chapterName,
                issue: 'Unclear format',
                questionId: question.id,
                sample: explanation.substring(0, 200)
            });
        }
    }

    // Save report
    const reportPath = join(__dirname, '../../chapter_verification_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Verified (Shortcut Format): ${report.verified.length}`);
    console.log(`❌ Issues Found: ${report.issues.length}`);
    console.log(`⚠️  Chapters Not Found: ${report.notFound.length}`);
    console.log(`\nReport saved to: ${reportPath}`);

    if (report.verified.length > 0) {
        console.log('\n✅ Verified Chapters:');
        report.verified.forEach(ch => console.log(`   - ${ch}`));
    }

    if (report.issues.length > 0) {
        console.log('\n❌ Chapters with Issues:');
        report.issues.forEach(item => console.log(`   - ${item.chapter}: ${item.issue}`));
    }

    if (report.notFound.length > 0) {
        console.log('\n⚠️  Chapters Not Found in Database:');
        report.notFound.forEach(ch => console.log(`   - ${ch}`));
    }

    await client.end();
}

verifyAllChapters().catch(console.error);

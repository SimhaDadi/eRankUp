import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to clear all existing explanations from the database
 * Run with: npx ts-node src/scripts/clear-explanations.ts
 */

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'erankup',
});

async function clearExplanations() {
    try {
        console.log('🔌 Connecting to database...');
        await AppDataSource.initialize();
        console.log('✅ Connected to database');

        // Start transaction
        await AppDataSource.transaction(async (manager) => {
            console.log('🗑️  Deleting all entries from question_explanation table...');
            const deleteResult = await manager.query('DELETE FROM question_explanation');
            console.log(`✅ Deleted ${deleteResult[1]} explanation records`);

            console.log('🗑️  Clearing explanation field from all questions...');
            const updateResult = await manager.query(
                "UPDATE question SET explanation = NULL WHERE explanation IS NOT NULL OR explanation = ''"
            );
            console.log(`✅ Cleared explanations from ${updateResult[1]} questions`);
        });

        // Verify cleanup
        console.log('\n📊 Verification:');
        const explanationCount = await AppDataSource.query(
            'SELECT COUNT(*) as count FROM question_explanation'
        );
        const questionsWithExplanations = await AppDataSource.query(
            "SELECT COUNT(*) as count FROM question WHERE explanation IS NOT NULL AND explanation != ''"
        );

        console.log(`   - question_explanation records: ${explanationCount[0].count}`);
        console.log(`   - Questions with explanations: ${questionsWithExplanations[0].count}`);

        if (explanationCount[0].count === '0' && questionsWithExplanations[0].count === '0') {
            console.log('\n✅ SUCCESS: All explanations have been cleared!');
        } else {
            console.log('\n⚠️  WARNING: Some explanations may still exist');
        }

        await AppDataSource.destroy();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing explanations:', error);
        await AppDataSource.destroy();
        process.exit(1);
    }
}

clearExplanations();

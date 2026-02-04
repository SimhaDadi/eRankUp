import { AppDataSource } from './src/data-source';

async function checkSchema() {
    try {
        await AppDataSource.initialize();
        console.log('DB Initialized');

        const result = await AppDataSource.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user'
        `);
        console.log('USER TABLE COLUMNS:');
        result.forEach(col => console.log(`- ${col.column_name} (${col.data_type})`));

        const rtHash = result.find(c => c.column_name === 'refreshTokenHash');
        if (!rtHash) {
            console.error('CRITICAL: refreshTokenHash column is MISSING!');
        } else {
            console.log('refreshTokenHash column exists.');
        }

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

checkSchema();

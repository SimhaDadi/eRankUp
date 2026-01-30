import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function diagnose() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        console.log('Database connection successful.');

        const extensions = await AppDataSource.query('SELECT name FROM pg_available_extensions WHERE name = \'vector\'');
        console.log('Available vector extension info:', extensions);

        if (extensions.length === 0) {
            console.error('CRITICAL: pgvector extension is NOT available in pg_available_extensions.');
        } else {
            console.log('Attempting to create vector extension...');
            await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
            console.log('Vector extension enabled successfully.');
        }

    } catch (error: any) {
        console.error('Diagnosis failed with message:', error.message);
        if (error.stack) console.error('Stack:', error.stack);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

diagnose();

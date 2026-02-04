import { AppDataSource } from './src/data-source';
import { Model } from './src/exams/entities/model.entity';
import { Chapter } from './src/exams/entities/chapter.entity';
import { Subject } from './src/exams/entities/subject.entity';

async function check() {
    try {
        await AppDataSource.initialize();
        console.log('DB Initialized');

        const models = await AppDataSource.query(`SELECT id, title FROM model WHERE title ILIKE '%Profit%'`);
        console.log('MODELS FOUND:', JSON.stringify(models, null, 2));

        const chapters = await AppDataSource.query(`SELECT id, title FROM chapter WHERE title ILIKE '%Profit%'`);
        console.log('CHAPTERS FOUND:', JSON.stringify(chapters, null, 2));

        const subjects = await AppDataSource.query(`SELECT id, title FROM subject WHERE title ILIKE '%Profit%'`);
        console.log('SUBJECTS FOUND:', JSON.stringify(subjects, null, 2));

        if (models.length === 0) {
            console.log('Broad search for latest models (by ID as proxy):');
            const latest = await AppDataSource.query(`SELECT id, title FROM model ORDER BY id DESC LIMIT 5`);
            console.log('LATEST 5 MODELS:', JSON.stringify(latest, null, 2));
        }

    } catch (err) {
        console.error('Error during check:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

check();

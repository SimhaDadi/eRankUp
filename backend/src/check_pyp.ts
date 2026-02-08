import { DataSource } from 'typeorm';
import { Exam } from './exams/entities/exam.entity';

import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function checkPyp() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
        entities: [Exam], // Minimal entity list for this check
        synchronize: false,
    });

    await dataSource.initialize();

    console.log('Checking for PYP exams...');
    const exams = await dataSource.getRepository(Exam).find({
        where: { type: 'previous_year_paper' as any }
    });

    console.log(`Found ${exams.length} PYP exams.`);
    exams.forEach(e => {
        console.log(`- [${e.id}] ${e.title} (Published: ${e.isPublished})`);
    });

    await dataSource.destroy();
}

checkPyp().catch(console.error);

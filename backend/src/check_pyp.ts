import { DataSource } from 'typeorm';
import { Exam } from './exams/entities/exam.entity';

async function checkPyp() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
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

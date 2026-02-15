
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { ExamsService } from '../exams/exams.service';
import { ExamType } from '../exams/entities/exam.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const examsService = app.get(ExamsService);

    console.log('--- Database Connected ---');

    // 1. Manual Migration Check
    const runner = dataSource.createQueryRunner();
    await runner.connect();

    try {
        const hasColumn = await runner.hasColumn("exam", "metadata");
        console.log(`Column "metadata" exists in "exam" table: ${hasColumn}`);

        if (!hasColumn) {
            console.log('Adding "metadata" column manually...');
            await runner.query(`ALTER TABLE "exam" ADD "metadata" jsonb`);
            console.log('Column added successfully.');
        }
    } catch (err) {
        console.error('Error during manual migration:', err);
    } finally {
        await runner.release();
    }

    // 2. Check Question Banks
    console.log('--- Checking Question Banks ---');

    try {
        const result = await examsService.findAll({
            type: ExamType.QUESTION_BANK,
            includeUnpublished: true,
            limit: 100
        });

        const exams = Array.isArray(result) ? result : result.data;

        console.log(`Found ${exams.length} Question Banks.`);

        if (exams.length > 0) {
            console.table(exams.map(e => ({
                id: e.id,
                title: e.title,
                isPublished: e.isPublished,
                // Safe access in case metadata is null
                topics: e.metadata?.chapterName || 'N/A'
            })));
        } else {
            console.log('No Question Banks found.');
        }
    } catch (err) {
        console.error('Error fetching exams:', err);
    }

    await app.close();
}

bootstrap();

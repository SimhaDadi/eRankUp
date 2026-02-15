import { DataSource } from 'typeorm';
import { Exam } from './exams/entities/exam.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Subject } from './exams/entities/subject.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Purchase } from './exams/entities/purchase.entity';
import { User } from './users/user.entity';

import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function repairHierarchy() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
        entities: [Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase, User],
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('--- Starting Hierarchy Repair ---');

    const examRepo = dataSource.getRepository(Exam);
    const subjectRepo = dataSource.getRepository(Subject);
    const chapterRepo = dataSource.getRepository(Chapter);

    // 1. Get the main exam
    const exams = await examRepo.find();
    if (exams.length === 0) {
        console.log('No exams found. Nothing to repair.');
        await dataSource.destroy();
        return;
    }

    const sscExam = exams.find(e => e.title.includes('SSC CGL')) || exams[0];
    console.log(`Using exam: ${sscExam.title} (${sscExam.id})`);

    // 2. Create default subjects if they don't exist
    // Map existing chapters to logical subjects
    const subjectMappings: Record<string, string[]> = {
        'Quantitative Aptitude': ['Quantitative Aptitude'],
        'English Language': ['English Comprehension'],
        'General Intelligence': ['General Intelligence & Reasoning'],
        'General Awareness': ['General Awareness']
    };

    for (const [subjectTitle, chapterTitles] of Object.entries(subjectMappings)) {
        let subject = await subjectRepo.findOne({ where: { title: subjectTitle, exam: { id: sscExam.id } } });
        if (!subject) {
            subject = subjectRepo.create({
                title: subjectTitle,
                exam: sscExam,
                description: `Subject for ${subjectTitle}`
            });
            await subjectRepo.save(subject);
            console.log(`Created subject: ${subjectTitle}`);
        }

        // 3. Link chapters to this subject
        for (const chTitle of chapterTitles) {
            const chapter = await chapterRepo.findOne({ where: { title: chTitle } });
            if (chapter) {
                chapter.subject = subject;
                await chapterRepo.save(chapter);
                console.log(`Linked chapter "${chTitle}" to subject "${subjectTitle}"`);
            } else {
                console.log(`Chapter "${chTitle}" not found.`);
            }
        }
    }

    console.log('--- Hierarchy Repair Completed ---');
    await dataSource.destroy();
}

repairHierarchy().catch(err => {
    console.error('REPAIR ERROR:', err);
    process.exit(1);
});

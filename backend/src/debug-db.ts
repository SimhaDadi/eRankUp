import { DataSource } from 'typeorm';
import { Exam } from './exams/entities/exam.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Subject } from './exams/entities/subject.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Purchase } from './exams/entities/purchase.entity';
import { User, UserRole } from './users/user.entity';

import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function debug() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
        entities: [Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase, User],
        synchronize: true,
    });

    await dataSource.initialize();
    console.log('--- Connected to DB ---');

    const examRepo = dataSource.getRepository(Exam);
    const exams = await examRepo.find();

    console.log(`Found ${exams.length} exams:`);
    exams.forEach(exam => {
        console.log(`ID: ${exam.id} | Title: "${exam.title}" | Type: ${exam.type} | Published: ${exam.isPublished}`);
    });

    await dataSource.destroy();
}

debug().catch(err => {
    console.error('DEBUG ERROR:', err);
    process.exit(1);
});

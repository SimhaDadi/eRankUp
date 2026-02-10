import { DataSource } from 'typeorm';
import { Model } from './backend/src/exams/entities/model.entity';
import { Question } from './backend/src/exams/entities/question.entity';
import { Exam } from './backend/src/exams/entities/exam.entity';
import { Subject } from './backend/src/exams/entities/subject.entity';
import { Chapter } from './backend/src/exams/entities/chapter.entity';
import { User } from './backend/src/users/user.entity';
import { Attempt } from './backend/src/exams/entities/attempt.entity';
import { Response } from './backend/src/exams/entities/response.entity';
import { Purchase } from './backend/src/exams/entities/purchase.entity';
import { SavedQuestion } from './backend/src/users/saved-question.entity';
import { UserStats } from './backend/src/users/entities/user-stats.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, 'backend/.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'erankup',
    password: process.env.DB_PASSWORD || 'TestPassword123',
    database: process.env.DB_NAME || 'erankup',
    entities: [Exam, Subject, Chapter, Model, Question, User, Attempt, Response, Purchase, SavedQuestion, UserStats],
    synchronize: false,
});

async function listModels() {
    await AppDataSource.initialize();

    const models = await AppDataSource.getRepository(Model).find({
        relations: ['questions']
    });

    console.log('ID | Title | QuestionsCount');
    console.log('---|---|---');
    for (const m of models) {
        console.log(`${m.id} | ${m.title} | ${m.questions?.length || 0}`);
    }

    await AppDataSource.destroy();
}

listModels().catch(console.error);

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './users/user.entity';
import { Exam } from './exams/entities/exam.entity';
import { Subject } from './exams/entities/subject.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Purchase } from './exams/entities/purchase.entity';

config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'erankup_db',
    synchronize: false,
    logging: true,
    entities: [User, Exam, Subject, Chapter, Model, Question, Attempt, Response, Purchase],
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    subscribers: [],
});

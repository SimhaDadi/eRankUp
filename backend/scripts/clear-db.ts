import { DataSource } from 'typeorm';
import { Exam } from '../src/exams/entities/exam.entity';
import { Chapter } from '../src/exams/entities/chapter.entity';
import { Subject } from '../src/exams/entities/subject.entity';
import { Model } from '../src/exams/entities/model.entity';
import { Question } from '../src/exams/entities/question.entity';
import { Attempt } from '../src/exams/entities/attempt.entity';
import { Response } from '../src/exams/entities/response.entity';
import { Purchase } from '../src/exams/entities/purchase.entity';
import { User } from '../src/users/user.entity';
// Hardcoded defaults matching local .env
// import * as dotenv from 'dotenv';
// dotenv.config();

async function clearDatabase() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'erankup_db',
        entities: [Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase, User],
        synchronize: true, // Auto-create schema if missing, but we are truncating
    });

    try {
        await dataSource.initialize();
        console.log('Connected to database. Starting cleanup...');

        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();

        // Disable foreign key constraints to allow truncating in any order
        // Note: Specific to PostgreSQL
        await queryRunner.query(`DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;`);

        console.log('SUCCESS: All tables cleared.');

        await queryRunner.release();
        await dataSource.destroy();
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
}

clearDatabase();

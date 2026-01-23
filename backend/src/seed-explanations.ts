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
import { QuestionExplanation } from './ai/entities/question-explanation.entity';

async function seedExplanations() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase, User, QuestionExplanation],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('Database connected.');

        // 1. Create table with proper casing if not exists
        console.log('Ensuring table exists with proper casing...');
        await dataSource.query(`
            CREATE TABLE IF NOT EXISTS question_explanation (
                id uuid PRIMARY KEY,
                "questionId" uuid NOT NULL,
                "contextExamId" uuid,
                "aiExplanation" text NOT NULL,
                "adminApprovedExplanation" text,
                "isVerified" boolean NOT NULL DEFAULT false,
                "helpfulCount" integer NOT NULL DEFAULT 0,
                "notHelpfulCount" integer NOT NULL DEFAULT 0,
                "averageRating" double precision NOT NULL DEFAULT 0,
                "viewCount" integer NOT NULL DEFAULT 0,
                "createdAt" timestamp NOT NULL DEFAULT now(),
                "updatedAt" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "FK_question_id" FOREIGN KEY ("questionId") REFERENCES question(id) ON DELETE CASCADE
            )
        `);

        console.log('Fetching questions...');
        const questions = await dataSource.query('SELECT id, content, options, "correctOptionId", topic FROM question');
        console.log(`Found ${questions.length} questions.`);

        let createdCount = 0;

        for (const question of questions) {
            // Check if exists
            const existing = await dataSource.query('SELECT id FROM question_explanation WHERE "questionId" = $1', [question.id]);

            if (existing.length === 0) {
                let options = question.options || [];
                if (typeof options === 'string') {
                    try {
                        options = JSON.parse(options);
                    } catch (e) {
                        options = [];
                    }
                }
                const correctOption = options.find((o: any) => o.id === question.correctOptionId);
                const correctText = correctOption ? String(correctOption.text).replace(/'/g, "''") : 'Unknown';
                const topic = question.topic || 'General';

                const aiExplanation = `**Solution:**\n\nThe correct answer is **(${question.correctOptionId}) ${correctText}**.\n\n### Logic:\nThis is a sample explanation for the seeded question regarding "${topic}".\n\n1. Analyze the context of the question.\n2. Apply the core concept of ${topic}.\n3. Verify against the options.\n\n**Key Takeaway:** Always ensure you understand the fundamental principles of ${topic} before answering.`;

                await dataSource.query(`
                    INSERT INTO question_explanation 
                    (id, "questionId", "aiExplanation", "isVerified", "viewCount", "createdAt", "updatedAt") 
                    VALUES 
                    (uuid_generate_v4(), $1, $2, false, $3, now(), now())
                `, [question.id, aiExplanation, Math.floor(Math.random() * 50)]);

                createdCount++;
            }
        }

        console.log(`SUCCESS: Created ${createdCount} explanations.`);

    } catch (error) {
        console.error('Error seeding explanations:', error);
    } finally {
        await dataSource.destroy();
    }
}

seedExplanations();


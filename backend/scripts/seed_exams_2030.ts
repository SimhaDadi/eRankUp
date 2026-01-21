
import { DataSource } from 'typeorm';
import { Exam } from '../src/exams/entities/exam.entity';
import { Chapter } from '../src/exams/entities/chapter.entity';
import { Model } from '../src/exams/entities/model.entity';
import { Question } from '../src/exams/entities/question.entity';
import { User } from '../src/users/user.entity';
import { Attempt } from '../src/exams/entities/attempt.entity';
import { Purchase } from '../src/exams/entities/purchase.entity';
import { config } from 'dotenv';
import * as path from 'path';

// Load .env
const result = config();
if (result.error) {
    console.log('Dotenv error, trying explicit path');
    config({ path: path.resolve(__dirname, '../.env') });
}

console.log('DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    db: process.env.DB_NAME
});

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'erankup_db',
    entities: [Exam, Chapter, Model, Question, User, Attempt, Purchase],
    synchronize: false,
});

async function seed() {
    await AppDataSource.initialize();
    console.log('Database connected.');

    const examsToSeed = [
        { title: 'SSC CGL 2030', desc: 'Comprehensive tier 1 full mock test for SSC CGL 2030 aspirants.' },
        { title: 'SSC CHSL 2030', desc: 'Complete mock test series for SSC CHSL 2030.' },
        { title: 'SSC CPO 2030', desc: 'Mock test series for SSC CPO 2030 Sub-Inspector exam.' }
    ];

    const examsRepo = AppDataSource.getRepository(Exam);
    const chapterRepo = AppDataSource.getRepository(Chapter);
    const modelRepo = AppDataSource.getRepository(Model);
    const questionRepo = AppDataSource.getRepository(Question);

    for (const examData of examsToSeed) {
        let exam = await examsRepo.findOne({ where: { title: examData.title } });
        if (exam) {
            console.log(`${examData.title} already exists. Skipping...`);
            continue;
        }

        console.log(`Seeding ${examData.title}...`);

        exam = examsRepo.create({
            title: examData.title,
            description: examData.desc,
            isPremium: false,
            price: 0
        });
        exam = await examsRepo.save(exam);

        // Chapters don't have direct exam relationship
        const chapter = chapterRepo.create({
            title: 'Full Mock Papers',
            description: 'Complete syllabus coverage'
        });
        await chapterRepo.save(chapter);

        // Link model to exam via many-to-many relationship
        const model = modelRepo.create({
            title: `${examData.title} - Mock Test 1`,
            chapter,
            totalQuestions: 100,
            scheduledAt: new Date(),
            exams: [exam] // Link model to exam
        });
        await modelRepo.save(model);

        const questionsToCreate = [];
        for (let i = 1; i <= 100; i++) {
            let topic = 'General Awareness';
            if (i > 25) topic = 'Reasoning';
            if (i > 50) topic = 'Quantitative Aptitude';
            if (i > 75) topic = 'English Comprehension';

            questionsToCreate.push({
                content: `[${examData.title}] Question ${i}: This is a sample question for ${topic}. Identify the correct answer.`,
                options: [
                    { id: 'a', text: `Option A for Q${i}` },
                    { id: 'b', text: `Option B for Q${i}` },
                    { id: 'c', text: `Option C for Q${i}` },
                    { id: 'd', text: `Option D for Q${i}` },
                ],
                correctOptionId: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)],
                explanation: `Explanation for Q${i}: The correct answer is derived based on ${topic} principles.`,
                topic,
                model
            });
        }

        // Save in chunks to avoid packet size issues
        const chunkSize = 50;
        for (let i = 0; i < questionsToCreate.length; i += chunkSize) {
            const chunk = questionsToCreate.slice(i, i + chunkSize);
            const questionsEntities = questionRepo.create(chunk);
            await questionRepo.save(questionsEntities);
        }

        console.log(`Created 100 questions for ${examData.title}`);
    }

    console.log('Seeding complete.');
    await AppDataSource.destroy();
}

seed().catch((err) => {
    console.error('Error seeding:', err);
    process.exit(1);
});

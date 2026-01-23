import { DataSource } from 'typeorm';
import { User, UserRole } from './users/user.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { Exam } from './exams/entities/exam.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Subject } from './exams/entities/subject.entity';
import { Purchase } from './exams/entities/purchase.entity';

async function seedActivity() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase, User],
        synchronize: false, // Important: Don't change schema
    });

    await dataSource.initialize();
    console.log('Connected to database for activity seeding...');

    const userRepo = dataSource.getRepository(User);
    const modelRepo = dataSource.getRepository(Model);
    const attemptRepo = dataSource.getRepository(Attempt);
    const questionRepo = dataSource.getRepository(Question);

    // 1. Create Students
    const students = [];
    const bcrypt = require('bcrypt');
    const password = await bcrypt.hash('password123', 10);

    for (let i = 1; i <= 5; i++) {
        const email = `student${i}@test.com`;
        let student = await userRepo.findOne({ where: { email } });
        if (!student) {
            student = userRepo.create({
                email: email,
                password: password,
                fullName: `Test Student ${i}`,
                role: UserRole.STUDENT,
                isActive: true
            });
            student = await userRepo.save(student);
            console.log(`Created student: ${email}`);
        } else {
            console.log(`Student exists: ${email}`);
        }
        students.push(student);
    }

    // 2. Fetch Models
    const models = await modelRepo.find({ relations: ['questions'] });
    if (models.length === 0) {
        console.error('No models found! Run generic seed first.');
        process.exit(1);
    }

    // 3. Simulate Attempts
    console.log(`Found ${models.length} models. Simulating attempts...`);

    for (const student of students) {
        // Each student takes 1-3 random models
        const numAttempts = Math.floor(Math.random() * 3) + 1;
        const shuffledModels = models.sort(() => 0.5 - Math.random()).slice(0, numAttempts);

        for (const model of shuffledModels) {
            console.log(`Student ${student.email} attempting ${model.title}...`);

            // Create Attempt
            const attempt = new Attempt();
            attempt.user = student;
            attempt.model = model;
            attempt.examId = (model as any).exams?.[0]?.id; // heuristic, might fail if relations not loaded deep
            attempt.totalQuestions = model.totalQuestions || model.questions.length;

            // Generate responses
            const responses: Response[] = [];
            let correctCount = 0;
            let totalTime = 0;


            // Ensure questions are loaded
            let questions = await questionRepo.createQueryBuilder('q')
                .leftJoinAndSelect('q.models', 'm')
                .where('m.id = :modelId', { modelId: model.id })
                .getMany();

            if (questions.length === 0) {
                console.log(`Model ${model.title} has no questions. Linking random questions...`);
                // Fetch random questions
                const allQuestions = await questionRepo.find({ take: 50 });
                if (allQuestions.length > 0) {
                    questions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
                    model.questions = questions;
                    await modelRepo.save(model);
                    console.log(`Linked ${questions.length} questions to ${model.title}`);
                } else {
                    console.warn('No questions found in DB to link!');
                }
            }

            if (questions.length === 0) {
                console.warn(`Skipping attempt for ${model.title} - still no questions.`);
                continue;
            }


            for (const q of questions) {
                const response = new Response();
                response.question = q;

                // 70% chance correct
                const isCorrect = Math.random() > 0.3;
                response.isCorrect = isCorrect;
                response.selectedOptionId = isCorrect ? q.correctOptionId : (q.options[0]?.id || '1');
                response.timeSpent = Math.floor(Math.random() * 60) + 10; // 10-70 seconds
                response.answeredAt = new Date(); // now

                if (isCorrect) correctCount++;
                totalTime += response.timeSpent;
                responses.push(response);
            }

            attempt.responses = responses;
            attempt.score = responses.reduce((acc, r) => acc + (r.isCorrect ? (r.question.positiveMarks || 1) : -(r.question.negativeMarks || 0.25)), 0);
            attempt.correctAnswers = correctCount;
            attempt.timeTaken = totalTime;
            attempt.accuracy = (correctCount / questions.length) * 100;

            await attemptRepo.save(attempt);
            console.log(`Saved attempt for ${student.email}: Score ${attempt.score}, Accuracy ${attempt.accuracy.toFixed(1)}%`);
        }
    }

    console.log('--- Activity Seeding Completed ---');
    await dataSource.destroy();
}

seedActivity().catch(err => {
    console.error(err);
    process.exit(1);
});

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

async function seed() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase, User],
        synchronize: true,
    });

    await dataSource.initialize();

    console.log('--- Starting Bulk Seeding (100 Questions) ---');

    const examRepo = dataSource.getRepository(Exam);
    const chapterRepo = dataSource.getRepository(Chapter);
    const modelRepo = dataSource.getRepository(Model);
    const questionRepo = dataSource.getRepository(Question);

    // 1. Ensure SSC CGL Exam exists
    // 1. Ensure SSC CGL Exam exists
    let sscExam = await examRepo.findOne({ where: { title: 'SSC CGL 2024 (Full Prep)' } });
    if (!sscExam) {
        sscExam = examRepo.create({
            title: 'SSC CGL 2024 (Full Prep)',
            description: 'Comprehensive preparation set with 100 questions.',
            isPremium: false,
            price: 0,
            type: 'real_exam' as any // Force cast to avoid circular dependency import issues if enum not available
        });
        await examRepo.save(sscExam);
    }

    // 1b. Ensure Global Question Bank exists (for Hierarchy Page)
    let globalBank = await examRepo.findOne({ where: { title: 'Global Question Bank' } });
    if (!globalBank) {
        globalBank = examRepo.create({
            title: 'Global Question Bank',
            description: 'Master repository for all subjects and topics.',
            isPremium: false,
            price: 0,
            isPublished: true,
            type: 'question_bank' as any
        });
        await examRepo.save(globalBank);
    }

    const chapterData = [
        {
            title: 'Quantitative Aptitude',
            topics: ['Averages', 'Percentages', 'Time & Work', 'Algebra', 'Trigonometry'],
            questionsPerTopic: 5
        },
        {
            title: 'English Comprehension',
            topics: ['Synonyms', 'Antonyms', 'Grammar', 'One Word Substitution', 'Idioms'],
            questionsPerTopic: 5
        },
        {
            title: 'General Intelligence & Reasoning',
            topics: ['Number Series', 'Coding-Decoding', 'Blood Relations', 'Syllogism', 'Analogy'],
            questionsPerTopic: 5
        },
        {
            title: 'General Awareness',
            topics: ['Indian History', 'Geography', 'Polity', 'Science', 'Current Affairs'],
            questionsPerTopic: 5
        }
    ];

    for (const chInfo of chapterData) {
        // Chapters don't have direct exam relationship, they belong to subjects
        let chapter = await chapterRepo.findOne({ where: { title: chInfo.title } });
        if (!chapter) {
            chapter = chapterRepo.create({ title: chInfo.title });
            await chapterRepo.save(chapter);
        }

        // Create 1 model per chapter and link to exam
        const model = modelRepo.create({
            title: `${chInfo.title} Mastery Set`,
            chapter: chapter,
            totalQuestions: chInfo.topics.length * chInfo.questionsPerTopic,
            exams: [sscExam, globalBank] // Link model to BOTH Real Exam and Question Bank
        });
        await modelRepo.save(model);

        console.log(`Seeding questions for: ${chInfo.title}...`);

        for (const topic of chInfo.topics) {
            const bulkQuestions = [];
            for (let i = 1; i <= chInfo.questionsPerTopic; i++) {
                bulkQuestions.push({
                    content: `[${topic}] Sample SSC question #${i}: What is the correct analysis for this specific ${topic} scenario?`,
                    options: [
                        { id: '1', text: `Option A for question ${i}` },
                        { id: '2', text: `Option B for question ${i} (Correct)` },
                        { id: '3', text: `Option C for question ${i}` },
                        { id: '4', text: `Option D for question ${i}` }
                    ],
                    correctOptionId: '2',
                    explanation: `**Detailed Solution:**\n\nThe correct answer is Option B.\n\nHere is the step-by-step reasoning for this ${topic} problem:\n1. Analyze the input parameters.\n2. Apply the standard formula for ${topic}.\n3. Verify the result against the constraints.\n\nTherefore, Option B is the logically consistent choice.`,
                    topic: topic,
                    models: [model],
                    difficultyWeight: Math.random() // Initialize with random difficulty
                });
            }
            await questionRepo.save(bulkQuestions);
        }
    }


    // 2. Create Admin User
    const userRepo = dataSource.getRepository(User);
    const adminEmail = 'admin@erankup.com';
    let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    // dynamic import bcrypt to avoid issues if it's not top-level
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('adminpassword', 10);

    if (!adminUser) {
        // Create new
        adminUser = userRepo.create({
            email: adminEmail,
            password: hashedPassword,
            fullName: 'System Admin',
            role: UserRole.ADMIN,
            isActive: true
        });
        await userRepo.save(adminUser);
        console.log('SUCCESS: Admin user created: admin@erankup.com / adminpassword');
    } else {
        // Update existing to ensure password is correct
        adminUser.password = hashedPassword;
        adminUser.role = UserRole.ADMIN;
        adminUser.isActive = true;
        await userRepo.save(adminUser);
        console.log('SUCCESS: Admin user updated: admin@erankup.com / adminpassword');
    }

    // 3. Create Student User (for E2E testing)
    const studentEmail = 'student@test.com';
    let studentUser = await userRepo.findOne({ where: { email: studentEmail } });
    const hashedStudentPassword = await bcrypt.hash('student123', 10);

    if (!studentUser) {
        studentUser = userRepo.create({
            email: studentEmail,
            password: hashedStudentPassword,
            fullName: 'Test Student',
            role: UserRole.STUDENT,
            isActive: true
        });
        await userRepo.save(studentUser);
        console.log('SUCCESS: Student user created: student@test.com / student123');
    }

    console.log('------------------------------------------');
    console.log('SUCCESS: 100 Questions seeded across 4 chapters!');
    console.log('------------------------------------------');
    await dataSource.destroy();
}

seed().catch(err => {
    console.error('CRITICAL SEEDING ERROR:', err);
    process.exit(1);
});

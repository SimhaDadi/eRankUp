import { DataSource } from 'typeorm';
import { Exam, ExamType } from './exams/entities/exam.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Subject } from './exams/entities/subject.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Purchase } from './exams/entities/purchase.entity';
import { User } from './users/user.entity';

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
    console.log('--- Connecting to DB and starting custom seeding ---');

    const examRepo = dataSource.getRepository(Exam);
    const subjectRepo = dataSource.getRepository(Subject);
    const chapterRepo = dataSource.getRepository(Chapter);
    const modelRepo = dataSource.getRepository(Model);
    const questionRepo = dataSource.getRepository(Question);

    // Helper to generate questions
    const createQuestions = async (count: number, model: Model, topic: string) => {
        const questions = [];
        for (let i = 1; i <= count; i++) {
            questions.push(questionRepo.create({
                content: `[${topic}] Question #${i}: What is the primary characteristic of ${topic} in a competitive exam context?`,
                options: [
                    { id: '1', text: `Standard property of ${topic}` },
                    { id: '2', text: `Correct application of ${topic} logic` },
                    { id: '3', text: `Common misconception in ${topic}` },
                    { id: '4', text: `Advanced theory of ${topic}` }
                ],
                correctOptionId: '2',
                explanation: `The solution involves understanding the fundamental principles of ${topic}. Step 1: Identify keywords. Step 2: Apply logic. Step 3: Choose option 2.`,
                topic: topic,
                models: [model],
                difficultyWeight: Math.random()
            }));
        }
        return await questionRepo.save(questions);
    };

    // Seeding Live Exams
    console.log('Seeding Live Exams...');
    for (let i = 1; i <= 2; i++) {
        const isLiveNow = i === 1;
        const liveExam = examRepo.create({
            title: `Live Scholarship Test #${i}`,
            description: `A live competitive test with real-time leaderboard for session ${i}.`,
            type: ExamType.LIVE_EXAM,
            category: 'Scholarship',
            isLive: true,
            isPublished: true,
            startTime: isLiveNow ? new Date(Date.now() - 1000 * 60 * 30) : new Date(Date.now() + 1000 * 60 * 60 * 24),
            endTime: isLiveNow ? new Date(Date.now() + 1000 * 60 * 90) : new Date(Date.now() + 1000 * 60 * 60 * 26),
        });
        await examRepo.save(liveExam);

        // Add a mock model for the live exam
        const liveModel = modelRepo.create({
            title: `Live Test Paper ${i}`,
            totalQuestions: 20,
            duration: 30,
            difficulty: 'hard',
            exams: [liveExam]
        });
        await modelRepo.save(liveModel);

        // Create and link questions directly to both model and exam
        const questions = [];
        for (let qIdx = 1; qIdx <= 20; qIdx++) {
            questions.push(questionRepo.create({
                content: `Live Quiz Question ${i}-${qIdx}: What is the primary characteristic of competitive coding?`,
                options: [
                    { id: '0', text: 'Speed' },
                    { id: '1', text: 'Complexity' },
                    { id: '2', text: 'Design' },
                    { id: '3', text: 'Memory' }
                ],
                correctOptionId: '0',
                explanation: 'Speed and efficiency are key in competitive coding.',
                topic: 'Live Competition',
                difficultyWeight: 0.7,
                models: [liveModel],
                exams: [liveExam]
            }));
        }
        await questionRepo.save(questions);
    }

    // 2. SSC CGL 2026
    console.log('Seeding SSC CGL 2026...');
    const sscCgl = examRepo.create({
        title: 'SSC CGL 2026',
        description: 'Elite preparation package for SSC CGL 2026 with full-length mocks and chapter tests.',
        type: ExamType.REAL_EXAM,
        category: 'SSC',
        isPremium: true,
        price: 499,
        isPublished: true
    });
    await examRepo.save(sscCgl);

    // 2a. SSC Mock Tests
    for (let i = 1; i <= 2; i++) {
        const mock = modelRepo.create({
            title: `SSC CGL 2026 Mock Test #${i}`,
            totalQuestions: 100,
            duration: 60,
            difficulty: 'medium',
            exams: [sscCgl],
            positiveMarks: 2,
            negativeMarks: 0.5
        });
        await modelRepo.save(mock);
        await createQuestions(20, mock, 'SSC Mock'); // 20 sample questions per mock
    }

    // 2b. SSC Chapter Tests
    const sscSubjects = [
        { name: 'Quantitative Aptitude', chapters: ['Speed, Time & Distance', 'Data Interpretation'] },
        { name: 'General Intelligence', chapters: ['Syllogism', 'Seating Arrangement'] },
        { name: 'English Language', chapters: ['Reading Comprehension', 'Sentence Improvement'] },
        { name: 'General Awareness', chapters: ['Modern Indian History', 'Static GK'] }
    ];

    for (const sub of sscSubjects) {
        const subject = subjectRepo.create({ title: sub.name, exam: sscCgl });
        await subjectRepo.save(subject);
        for (const chName of sub.chapters) {
            const chapter = chapterRepo.create({ title: chName, subject });
            await chapterRepo.save(chapter);
            for (let i = 1; i <= 2; i++) {
                const model = modelRepo.create({
                    title: `${chName} - Practice Set #${i}`,
                    totalQuestions: 10,
                    duration: 10,
                    difficulty: i === 1 ? 'easy' : 'medium',
                    chapter: chapter,
                    exams: [sscCgl]
                });
                await modelRepo.save(model);
                await createQuestions(10, model, chName);
            }
        }
    }

    // 3. RRB NTPC 2026
    console.log('Seeding RRB NTPC 2026...');
    const rrbNtpc = examRepo.create({
        title: 'RRB NTPC 2026',
        description: 'Official mock series for Railway NTPC 2026 recruitment.',
        type: ExamType.REAL_EXAM,
        category: 'Railways',
        isPremium: true,
        price: 399,
        isPublished: true
    });
    await examRepo.save(rrbNtpc);

    // 3a. RRB Mock Tests
    for (let i = 1; i <= 2; i++) {
        const mock = modelRepo.create({
            title: `RRB NTPC 2026 Full Mock #${i}`,
            totalQuestions: 120,
            duration: 90,
            difficulty: 'medium',
            exams: [rrbNtpc],
            positiveMarks: 1,
            negativeMarks: 0.33
        });
        await modelRepo.save(mock);
        await createQuestions(20, mock, 'RRB Mock');
    }

    // 3b. RRB Chapter Tests
    const rrbSubjects = [
        { name: 'Mathematics', chapters: ['Number System', 'Simple Interest'] },
        { name: 'General Intelligence', chapters: ['Analogies', 'Venn Diagrams'] },
        { name: 'General Science', chapters: ['Physics Concepts', 'Biology Basics'] }
    ];

    for (const sub of rrbSubjects) {
        const subject = subjectRepo.create({ title: sub.name, exam: rrbNtpc });
        await subjectRepo.save(subject);
        for (const chName of sub.chapters) {
            const chapter = chapterRepo.create({ title: chName, subject });
            await chapterRepo.save(chapter);
            for (let i = 1; i <= 2; i++) {
                const model = modelRepo.create({
                    title: `${chName} - Level ${i}`,
                    totalQuestions: 10,
                    duration: 10,
                    difficulty: i === 1 ? 'easy' : 'medium',
                    chapter: chapter,
                    exams: [rrbNtpc]
                });
                await modelRepo.save(model);
                await createQuestions(10, model, chName);
            }
        }
    }

    console.log('------------------------------------------');
    console.log('SUCCESS: Requested test data seeded successfully!');
    console.log('------------------------------------------');
    await dataSource.destroy();
}

seed().catch(err => {
    console.error('SEEDING ERROR:', err);
    process.exit(1);
});

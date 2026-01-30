import { DataSource } from 'typeorm';
import { Category } from './categories/entities/category.entity';
import { Exam } from './exams/entities/exam.entity';
import { Subject } from './exams/entities/subject.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { User } from './users/user.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Purchase } from './exams/entities/purchase.entity';

async function seed() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [Category, Exam, Subject, Chapter, Model, Question, User, Attempt, Response, Purchase],
        synchronize: true,
    });

    await dataSource.initialize();
    console.log('--- Seeding SSC & Railway Focus Data ---');

    const categoryRepo = dataSource.getRepository(Category);
    const examRepo = dataSource.getRepository(Exam);
    const subjectRepo = dataSource.getRepository(Subject);
    const chapterRepo = dataSource.getRepository(Chapter);
    const modelRepo = dataSource.getRepository(Model);
    const questionRepo = dataSource.getRepository(Question);

    // 1. Create Categories
    const categoriesData = [
        { name: 'SSC', slug: 'ssc', isVisible: true, order: 1 },
        { name: 'Railway', slug: 'railway', isVisible: true, order: 2 },
    ];

    for (const cat of categoriesData) {
        let category = await categoryRepo.findOne({ where: { name: cat.name } });
        if (!category) {
            category = categoryRepo.create(cat);
            await categoryRepo.save(category);
            console.log(`Created Category: ${cat.name}`);
        }
    }

    // 2. Create Question Bank Exams (for Chapter Wise Tests)
    const bankExams = [
        { title: 'SSC Question Bank', category: 'SSC', type: 'question_bank', isPublished: true },
        { title: 'Railway Question Bank', category: 'Railway', type: 'question_bank', isPublished: true },
    ];

    for (const bank of bankExams) {
        let exam = await examRepo.findOne({ where: { title: bank.title } });
        if (!exam) {
            const newExam = examRepo.create(bank as any);
            // In some TypeORM versions create returns an array if it's not careful
            exam = Array.isArray(newExam) ? newExam[0] : newExam;
            await examRepo.save(exam);
            console.log(`Created Exam Bank: ${bank.title}`);
        }

        // Add some subjects and chapters to the SSC bank specifically for demonstration
        if (bank.title === 'SSC Question Bank') {
            const subjects = ['Mathematics', 'Reasoning', 'General Awareness'];
            for (const subName of subjects) {
                let subject = await subjectRepo.findOne({
                    where: { title: subName, exam: { id: exam.id } },
                    relations: ['exam']
                });
                if (!subject) {
                    subject = subjectRepo.create({ title: subName, exam: exam });
                    await subjectRepo.save(subject);
                    console.log(`  Added Subject: ${subName}`);
                }

                // Add chapters
                const chapters = subName === 'Mathematics' ? ['Number System', 'Time & Work'] :
                    subName === 'Reasoning' ? ['Analogy', 'Coding-Decoding'] :
                        ['Indian History', 'Geography'];

                for (const chapName of chapters) {
                    let chapter = await chapterRepo.findOne({
                        where: { title: chapName, subject: { id: subject.id } },
                        relations: ['subject']
                    });
                    if (!chapter) {
                        chapter = chapterRepo.create({ title: chapName, subject: subject });
                        await chapterRepo.save(chapter);
                        console.log(`    Added Chapter: ${chapName}`);
                    }

                    // Create a Model for the chapter to make it "Practicable"
                    const model = await modelRepo.create({
                        title: `${chapName} Practice Set`,
                        chapter: chapter,
                        totalQuestions: 5,
                        exams: [exam]
                    });
                    await modelRepo.save(model);

                    // Add 5 dummy questions
                    for (let i = 1; i <= 5; i++) {
                        await questionRepo.save({
                            content: `[${chapName}] sample question ${i} for SSC focus.`,
                            options: [
                                { id: '1', text: 'Option A' },
                                { id: '2', text: 'Option B (Correct)' },
                                { id: '3', text: 'Option C' },
                                { id: '4', text: 'Option D' }
                            ],
                            correctOptionId: '2',
                            explanation: 'Detailed explanation for SSC aspirants.',
                            topic: chapName,
                            models: [model]
                        });
                    }
                }
            }
        }
    }

    console.log('--- Seeding Complete! ---');
    await dataSource.destroy();
}

seed().catch(err => {
    console.error('SEEDING ERROR:', err);
    process.exit(1);
});

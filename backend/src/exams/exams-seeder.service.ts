import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Model } from './entities/model.entity';
import { Question } from './entities/question.entity';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ExamsSeederService implements OnApplicationBootstrap {
    private redis: Redis;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Exam)
        private examsRepository: Repository<Exam>,
        @InjectRepository(Subject)
        private subjectRepository: Repository<Subject>,
        @InjectRepository(Chapter)
        private chapterRepository: Repository<Chapter>,
        @InjectRepository(Model)
        private modelRepository: Repository<Model>,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
    ) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
        });
    }

    async onApplicationBootstrap() {
        const count = await this.examsRepository.count();
        if (count > 0) return;

        console.log('Seeding Global Content Bank...');

        const subject = await this.subjectRepository.save({
            title: 'Quantitative Aptitude',
            description: 'Numerical ability and mathematical skills.',
            icon: 'Binary'
        });

        const chapter = await this.chapterRepository.save({
            title: 'Geometry & Mensuration',
            description: 'Study of shapes, sizes, and relative position of figures.',
            subject
        });

        const exam = await this.examsRepository.save({
            title: 'SSC CGL Tier I - 2024',
            description: 'Combined Graduate Level Examination by Staff Selection Commission.',
        });

        const model = await this.modelRepository.save({
            title: 'Geometry - Set A',
            chapter,
            exams: [exam]
        });

        const questions = [
            {
                content: "The length of the diagonal of a square is 10cm. What is its area?",
                options: [
                    { id: "a", text: "25 cm²" },
                    { id: "b", text: "50 cm²" },
                    { id: "c", text: "100 cm²" },
                    { id: "d", text: "75 cm²" },
                ],
                correctOptionId: "b",
                explanation: "Area = 1/2 * d². Area = 1/2 * 10 * 10 = 50 cm².",
                models: [model],
                subject,
                chapter
            },
            {
                content: "If the radius of a circle is increased by 10%, what is the percentage increase in its area?",
                options: [
                    { id: "a", text: "10%" },
                    { id: "b", text: "20%" },
                    { id: "c", text: "21%" },
                    { id: "d", text: "100%" },
                ],
                correctOptionId: "c",
                explanation: "Successive change = 10 + 10 + (10*10)/100 = 21%.",
                models: [model],
                subject,
                chapter
            }
        ];

        for (const q of questions) {
            await this.questionRepository.save(this.questionRepository.create(q));
        }

        console.log('Seeding Complete!');
    }

    private async invalidateCache(examId?: string) {
        await this.redis.del('exams:all');
        if (examId) {
            await this.redis.del(`exam:${examId}`);
        }
    }

    private async getOrCreateSubject(title: string) {
        let subject = await this.subjectRepository.findOne({ where: { title } });
        if (!subject) {
            subject = this.subjectRepository.create({ title, description: `${title} description` });
            subject = await this.subjectRepository.save(subject);
        }
        return subject;
    }

    private async getOrCreateChapter(subject: Subject, title: string) {
        let chapter = this.chapterRepository.create({ title, subject });
        chapter = await this.chapterRepository.save(chapter);
        return chapter;
    }

    async seedSSC2026() {
        const title = 'SSC CGL 2026';
        let exam = await this.examsRepository.findOne({ where: { title } });
        if (exam) return { message: 'Exam already exists', id: exam.id };

        const subject = await this.getOrCreateSubject('General Awareness');
        const chapter = await this.getOrCreateChapter(subject, 'Geography');

        exam = this.examsRepository.create({
            title,
            description: 'Comprehensive tier 1 full mock test for SSC CGL 2026 aspirants.',
            isPremium: false
        });
        exam = await this.examsRepository.save(exam);

        const model = this.modelRepository.create({
            title: 'SSC CGL 2026 - Mock Test 1',
            chapter,
            exams: [exam]
        });
        await this.modelRepository.save(model);

        const questionsToCreate = [];
        for (let i = 1; i <= 100; i++) {
            questionsToCreate.push({
                content: `Question ${i}: This is a simulated question for SSC CGL 2026.`,
                options: [
                    { id: 'a', text: `Option A for Q${i}` },
                    { id: 'b', text: `Option B for Q${i}` },
                    { id: 'c', text: `Option C for Q${i}` },
                    { id: 'd', text: `Option D for Q${i}` },
                ],
                correctOptionId: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)],
                explanation: `Explanation for Q${i}.`,
                models: [model],
                subject,
                chapter
            });
        }

        const questionsEntities = this.questionRepository.create(questionsToCreate);
        await this.questionRepository.save(questionsEntities);
        await this.invalidateCache();

        return { message: 'Seeded 100 questions for SSC CGL 2026', examId: exam.id, modelId: model.id };
    }

    async seedSSC2027() {
        const title = 'SSC CGL 2027';
        let exam = await this.examsRepository.findOne({ where: { title } });
        if (exam) return { message: 'Exam already exists', id: exam.id };

        const subject = await this.getOrCreateSubject('Quantitative Aptitude');
        const chapter = await this.getOrCreateChapter(subject, 'Algebra');

        exam = this.examsRepository.create({
            title,
            description: 'Advanced mock test for upcoming SSC CGL 2027 cycle.',
            isPremium: false
        });
        exam = await this.examsRepository.save(exam);

        const model = this.modelRepository.create({
            title: 'SSC CGL 2027 - Mock Test 1',
            chapter,
            exams: [exam]
        });
        await this.modelRepository.save(model);

        const questionsToCreate = [];
        for (let i = 1; i <= 50; i++) {
            questionsToCreate.push({
                content: `2027 Pattern Q${i}: Analyze the logical sequence.`,
                options: [
                    { id: 'a', text: `Predictive Option A` },
                    { id: 'b', text: `Predictive Option B` },
                    { id: 'c', text: `Predictive Option C` },
                    { id: 'd', text: `Predictive Option D` },
                ],
                correctOptionId: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)],
                explanation: `Detailed AI-generated explanation for Q${i}.`,
                topic: i % 2 === 0 ? 'Algebra' : 'Geometry',
                models: [model],
                subject,
                chapter
            });
        }

        const questionsEntities = this.questionRepository.create(questionsToCreate);
        await this.questionRepository.save(questionsEntities);
        await this.invalidateCache();

        return { message: 'Seeded 50 questions for SSC CGL 2027', examId: exam.id, modelId: model.id };
    }

    async seedSSC2028() {
        const title = 'SSC CGL 2028';
        let exam = await this.examsRepository.findOne({ where: { title } });
        if (exam) {
            await this.invalidateCache(exam.id);
            return { message: 'Exam already exists', id: exam.id };
        }

        const subject = await this.getOrCreateSubject('English Comprehension');
        const chapter = await this.getOrCreateChapter(subject, 'Grammar');

        exam = this.examsRepository.create({
            title,
            description: 'Futuristic mock test for SSC CGL 2028 aspirants.',
            isPremium: false
        });
        exam = await this.examsRepository.save(exam);

        const model = this.modelRepository.create({
            title: 'SSC CGL 2028 - Full Mock',
            chapter,
            exams: [exam]
        });
        await this.modelRepository.save(model);

        const questionsToCreate = [];
        for (let i = 1; i <= 100; i++) {
            questionsToCreate.push({
                content: `2028 Pattern Q${i}: What is the correct answer?`,
                options: [
                    { id: 'a', text: `Option A` },
                    { id: 'b', text: `Option B` },
                    { id: "c", text: `Option C` },
                    { id: 'd', text: `Option D` },
                ],
                correctOptionId: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)],
                explanation: `Explanation for Q${i}.`,
                models: [model],
                exams: [exam],
                subject,
                chapter
            });
        }

        const questionsEntities = this.questionRepository.create(questionsToCreate);
        await this.questionRepository.save(questionsEntities);
        await this.invalidateCache(exam.id);

        return { message: 'Seeded 100 questions for SSC CGL 2028', examId: exam.id, modelId: model.id };
    }

    async seed2030Exams() {
        // ... same as before
        const examsToSeed = [
            { title: 'SSC CGL 2030', desc: 'Comprehensive tier 1 full mock test for SSC CGL 2030 aspirants.' },
            { title: 'SSC CHSL 2030', desc: 'Complete mock test series for SSC CHSL 2030.' },
            { title: 'SSC CPO 2030', desc: 'Mock test series for SSC CPO 2030 Sub-Inspector exam.' }
        ];

        const results = [];

        for (const examData of examsToSeed) {
            let exam = await this.examsRepository.findOne({ where: { title: examData.title } });
            if (exam) {
                results.push({ message: `${examData.title} already exists`, id: exam.id });
                continue;
            }

            const subject = await this.getOrCreateSubject('Multi-Subject');
            const chapter = await this.getOrCreateChapter(subject, 'Mock Papers');

            exam = this.examsRepository.create({
                title: examData.title,
                description: examData.desc,
                isPremium: false
            });
            exam = await this.examsRepository.save(exam);

            const model = this.modelRepository.create({
                title: `${examData.title} - Mock Test 1`,
                chapter,
                totalQuestions: 100,
                scheduledAt: new Date(),
                exams: [exam]
            });
            await this.modelRepository.save(model);

            const questionsToCreate = [];
            for (let i = 1; i <= 100; i++) {
                let topic = 'General Awareness';
                if (i > 25) topic = 'Reasoning';
                if (i > 50) topic = 'Quantitative Aptitude';
                if (i > 75) topic = 'English Comprehension';

                questionsToCreate.push({
                    content: `[${examData.title}] Question ${i}: Sample question for ${topic}.`,
                    options: [
                        { id: 'a', text: `Option A for Q${i}` },
                        { id: 'b', text: `Option B for Q${i}` },
                        { id: 'c', text: `Option C for Q${i}` },
                        { id: 'd', text: `Option D for Q${i}` },
                    ],
                    correctOptionId: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)],
                    explanation: `Explanation for Q${i}.`,
                    topic,
                    models: [model],
                    exams: [exam],
                    subject,
                    chapter
                });
            }

            const questionsEntities = this.questionRepository.create(questionsToCreate);
            await this.questionRepository.save(questionsEntities);

            results.push({ message: `Seeded 100 questions for ${examData.title}`, examId: exam.id });
        }

        await this.invalidateCache();
        return results;
    }
}

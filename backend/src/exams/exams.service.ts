import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Model } from './entities/model.entity';
import { Question } from './entities/question.entity';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ExamsService {
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

    async findAll() {
        const cacheKey = 'exams:all';
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const exams = await this.examsRepository.find({
            relations: ['models', 'models.chapter', 'models.chapter.subject']
        });

        await this.redis.set(cacheKey, JSON.stringify(exams), 'EX', 3600);
        return exams;
    }

    async findOne(id: string) {
        const cacheKey = `exam:${id}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            console.log('Cache HIT for', id);
            return JSON.parse(cached);
        }

        console.log('Cache MISS for', id);
        const exam = await this.examsRepository.findOne({
            where: { id },
            relations: ['models', 'models.chapter', 'models.chapter.subject']
        });

        if (exam) {
            console.log('Exam found:', exam.id, 'Models:', exam.models?.length);
            // Transform structure to match frontend expectation (group models by chapter)
            const chaptersMap = new Map();

            if (exam.models) {
                exam.models.forEach(model => {
                    console.log(`[DEBUG] Exam ${exam.id} Model ${model.id} totalQuestions: ${model.totalQuestions}`);
                    if (model.chapter) {
                        if (!chaptersMap.has(model.chapter.id)) {
                            chaptersMap.set(model.chapter.id, {
                                ...model.chapter,
                                models: []
                            });
                        }
                        chaptersMap.get(model.chapter.id).models.push(model);
                    } else {
                        console.log('Model missing chapter:', model.id);
                    }
                });
            }

            console.log('Chapters found:', chaptersMap.size);

            const transformedExam = {
                ...exam,
                chapters: Array.from(chaptersMap.values())
            };

            // console.log('Transformed:', JSON.stringify(transformedExam));

            await this.redis.set(cacheKey, JSON.stringify(transformedExam), 'EX', 3600);
            return transformedExam;
        }
        return exam;
    }

    async findLiveExams() {
        // Find exams where current date is between startTime and endTime
        return this.examsRepository
            .createQueryBuilder('exam')
            .leftJoinAndSelect('exam.models', 'model')
            .where('exam.startTime <= :now', { now: new Date() })
            .andWhere('exam.endTime >= :now', { now: new Date() })
            .orderBy('exam.startTime', 'DESC')
            .getMany();
    }

    findModel(id: string) {
        return this.modelRepository.findOne({
            where: { id },
            relations: ['chapter', 'chapter.subject', 'questions', 'exams']
        });
    }

    private async invalidateCache(examId?: string) {
        await this.redis.del('exams:all');
        if (examId) {
            await this.redis.del(`exam:${examId}`);
        }
    }

    // --- Hybrid Question Bank Methods ---

    /**
     * Get only global questions (examId = NULL)
     * These questions are available to all exams
     */
    async getGlobalQuestions(filters?: any) {
        return this.questionRepository.find({
            where: { examId: IsNull(), ...filters },
            relations: ['subject', 'chapter', 'models'],
            order: { difficultyWeight: 'ASC' }
        });
    }

    /**
     * Get exam-specific questions
     * These questions are exclusive to a particular exam
     */
    async getExamSpecificQuestions(examId: string, filters?: any) {
        return this.questionRepository.find({
            where: { examId, ...filters },
            relations: ['subject', 'chapter', 'models', 'exam'],
            order: { difficultyWeight: 'ASC' }
        });
    }

    /**
     * Get all available questions for an exam (global + exam-specific)
     * Used when creating models or selecting questions for an exam
     */
    async getAvailableQuestionsForExam(examId: string, filters?: any) {
        const globalQuestions = await this.getGlobalQuestions(filters);
        const examSpecificQuestions = await this.getExamSpecificQuestions(examId, filters);
        return [...globalQuestions, ...examSpecificQuestions];
    }

    /**
     * Validate that a question can be used in a model
     * Prevents exam-specific questions from being used in wrong exams
     */
    async validateQuestionForModel(questionId: string, modelId: string): Promise<boolean> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['exam']
        });

        if (!question) {
            throw new BadRequestException('Question not found');
        }

        // Global questions can be used anywhere
        if (!question.examId) {
            return true;
        }

        // For exam-specific questions, verify the model belongs to that exam
        const model = await this.modelRepository.findOne({
            where: { id: modelId },
            relations: ['exams']
        });

        if (!model) {
            throw new BadRequestException('Model not found');
        }

        const belongsToExam = model.exams.some(exam => exam.id === question.examId);
        if (!belongsToExam) {
            throw new BadRequestException(
                `Question is specific to "${question.exam?.title || 'another exam'}" and cannot be used in this model`
            );
        }

        return true;
    }

    /**
     * Get question bank statistics for admin dashboard
     */
    async getQuestionBankStats() {
        const totalQuestions = await this.questionRepository.count();
        const globalQuestions = await this.questionRepository.count({ where: { examId: IsNull() } });
        const examSpecificQuestions = totalQuestions - globalQuestions;

        const exams = await this.examsRepository.find();
        const examStats = await Promise.all(
            exams.map(async (exam) => ({
                examId: exam.id,
                examTitle: exam.title,
                specificQuestionCount: await this.questionRepository.count({ where: { examId: exam.id } })
            }))
        );

        return {
            total: totalQuestions,
            global: globalQuestions,
            examSpecific: examSpecificQuestions,
            byExam: examStats
        };
    }

    // --- Subject Management ---
    async createSubject(data: any) {
        const subject = this.subjectRepository.create(data);
        return this.subjectRepository.save(subject);
    }

    async findAllSubjects() {
        return this.subjectRepository.find({ relations: ['chapters'] });
    }

    async updateSubject(id: string, data: any) {
        await this.subjectRepository.update(id, data);
        await this.invalidateCache();
        return this.subjectRepository.findOneBy({ id });
    }

    async deleteSubject(id: string) {
        const subject = await this.subjectRepository.findOne({
            where: { id },
            relations: ['chapters']
        });

        if (subject?.chapters) {
            for (const chapter of subject.chapters) {
                await this.deleteChapter(id, chapter.id);
            }
        }

        const result = await this.subjectRepository.delete(id);
        await this.invalidateCache();
        return result;
    }

    // --- Exam Management ---
    async create(createExamDto: any) {
        const exam = this.examsRepository.create(createExamDto);
        const saved = await this.examsRepository.save(exam);
        await this.invalidateCache();
        return saved;
    }

    async createChapter(subjectId: string, data: any) {
        const subject = await this.subjectRepository.findOneBy({ id: subjectId });
        const chapter = this.chapterRepository.create({ ...data, subject });
        return this.chapterRepository.save(chapter);
    }

    async updateChapter(subjectId: string, chapterId: string, data: any) {
        await this.chapterRepository.update(chapterId, data);
        return this.chapterRepository.findOneBy({ id: chapterId });
    }

    async deleteChapter(subjectId: string, chapterId: string) {
        // Find chapter with all its models
        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId },
            relations: ['models']
        });

        if (chapter?.models) {
            // Delete all models associated with this chapter
            // Note: Since Models have ManyToMany with Questions and Exams,
            // TypeORM's repository.delete/remove should handle junction table cleanup
            // IF cascade is set, otherwise we might need to verify.
            // But usually deleting the "One" side of ManyToOne (Model side) works if no other constraints.
            // Let's delete models one by one to use the repository
            for (const model of chapter.models) {
                await this.modelRepository.delete(model.id);
            }
        }

        return this.chapterRepository.delete(chapterId);
    }

    async createModel(chapterId: string, data: any) {
        const chapter = await this.chapterRepository.findOne({ where: { id: chapterId } });
        const { exams, ...modelData } = data;
        const model = this.modelRepository.create({ ...modelData, chapter });
        const savedModel = await this.modelRepository.save(model);

        if (exams && exams.length > 0) {
            // exams is likely [{id: '...'}] from frontend or just IDs
            const examIds = exams.map((e: any) => (typeof e === 'object' && e?.id) ? e.id : e);

            // Manually update the relation since Exam is the owner side
            await this.examsRepository
                .createQueryBuilder()
                .relation(Exam, 'models')
                .of(examIds)
                .add((savedModel as any).id);

            // Invalidate cache for all affected exams
            for (const id of examIds) {
                await this.invalidateCache(id);
            }
        }

        return savedModel;
    }

    async createQuestion(modelId: string, data: any) {
        const model = await this.modelRepository.findOne({ where: { id: modelId }, relations: ['chapter', 'chapter.subject', 'exams'] });

        // If examId is provided, validate it matches the model's exam
        if (data.examId) {
            const belongsToExam = model?.exams?.some(exam => exam.id === data.examId);
            if (!belongsToExam) {
                throw new BadRequestException(
                    'Cannot create exam-specific question: examId does not match any exam associated with this model'
                );
            }
        }

        // Link to hierarchy for bank categorization
        const questionData = {
            ...data,
            subject: model?.chapter?.subject,
            chapter: model?.chapter,
            models: [model],
            examId: data.examId || null // Explicitly set to null for global questions
        };

        const question = this.questionRepository.create(questionData);
        await this.questionRepository.save(question);

        // Update Model Question Count
        await this.modelRepository.increment({ id: modelId }, 'totalQuestions', 1);

        // Invalidate Cache for all linked exams
        if (model.exams) {
            console.log(`[DEBUG] Found ${model.exams.length} exams to invalidate for model ${model.id}`);
            for (const exam of model.exams) {
                console.log(`[DEBUG] Invalidating cache for exam ${exam.id}`);
                await this.invalidateCache(exam.id);
            }
        } else {
            console.log(`[DEBUG] No exams found for model ${model.id} to invalidate.`);
        }

        return question;
    }

    async createQuestionsBulk(modelId: string, questionsData: any[]) {
        const model = await this.modelRepository.findOne({ where: { id: modelId }, relations: ['chapter', 'chapter.subject', 'exams'] });
        if (!model) throw new Error('Model not found');

        const questionsToCreate = questionsData.map(data => {
            const { id, ...rest } = data;

            // Validate examId if provided
            if (rest.examId) {
                const belongsToExam = model.exams?.some(exam => exam.id === rest.examId);
                if (!belongsToExam) {
                    throw new BadRequestException(
                        `Question with examId ${rest.examId} cannot be added to this model`
                    );
                }
            }

            return {
                ...rest,
                models: [model],
                subject: model.chapter?.subject,
                chapter: model.chapter,
                examId: rest.examId || null // Explicitly set to null for global questions
            };
        });
        const questionsEntities = this.questionRepository.create(questionsToCreate);
        const savedQuestions = await this.questionRepository.save(questionsEntities);

        // Update Model Question Count
        await this.modelRepository.increment({ id: modelId }, 'totalQuestions', savedQuestions.length);

        // Invalidate Cache for all linked exams
        if (model.exams) {
            console.log(`[DEBUG] Bulk created ${savedQuestions.length} questions. Invalidating cache for ${model.exams.length} exams.`);
            for (const exam of model.exams) {
                await this.invalidateCache(exam.id);
            }
        }

        return savedQuestions;
    }

    async deleteExam(id: string) {
        const res = await this.examsRepository.delete(id);
        await this.invalidateCache(id);
        return res;
    }

    // --- Helper for Seeders ---
    private async getOrCreateSubject(title: string) {
        let subject = await this.subjectRepository.findOne({ where: { title } });
        if (!subject) {
            subject = this.subjectRepository.create({ title, description: `${title} description` });
            subject = await this.subjectRepository.save(subject);
        }
        return subject;
    }

    private async getOrCreateChapter(subject: Subject, title: string) {
        let chapter = await this.chapterRepository.create({ title, subject });
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
                    { id: 'c', text: `Option C` },
                    { id: 'd', text: `Option D` },
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
        await this.invalidateCache(exam.id);

        return { message: 'Seeded 100 questions for SSC CGL 2028', examId: exam.id, modelId: model.id };
    }

    async seed2030Exams() {
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

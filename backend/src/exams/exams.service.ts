import { Injectable, BadRequestException, Inject, forwardRef, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Exam, ExamType } from './entities/exam.entity';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Model } from './entities/model.entity';
import { Question } from './entities/question.entity';
import { PaymentsService } from '../payments/payments.service';
import { CacheService } from '../common/cache.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateSubjectDto, CreateChapterDto, CreateModelDto } from '@erankup/shared';
import { ExplanationService } from '../ai/explanation.service';

@Injectable()
export class ExamsService implements OnApplicationBootstrap {
    constructor(
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
        @Inject(forwardRef(() => PaymentsService))
        private paymentsService: PaymentsService,
        private cacheService: CacheService,
        private explanationService: ExplanationService,
    ) { }

    async findAll(options: { includeUnpublished?: boolean; type?: string } = {}) {
        const { includeUnpublished = false, type } = options;
        const cacheKey = includeUnpublished ? `exams:all:admin:${type || 'all'}` : `exams:all:${type || 'all'}`;
        const cached = await this.cacheService.get<Exam[]>(cacheKey);
        if (cached) return cached;

        const where: any = {};
        if (!includeUnpublished) {
            where.isPublished = true;
        }
        if (type) {
            where.type = type;
        }

        const exams = await this.examsRepository.find({
            where,
            relations: ['models', 'models.chapter', 'models.chapter.subject']
        });

        await this.cacheService.set(cacheKey, exams, 3600);
        return exams;
    }

    async findOne(id: string, includeUnpublished: boolean = false) {
        const cacheKey = `exam:${id}`;
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) {
            console.log('Cache HIT for', id);
            return cached;
        }

        console.log('Cache MISS for', id);
        const exam = await this.examsRepository.findOne({
            where: includeUnpublished ? { id } : { id, isPublished: true },
            relations: ['models', 'models.chapter', 'models.chapter.subject', 'questions']
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

            await this.cacheService.set(cacheKey, transformedExam, 3600);
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

    async findModel(id: string, userId?: string) {
        const model = await this.modelRepository.findOne({
            where: { id },
            relations: ['chapter', 'chapter.subject', 'questions', 'exams']
        });

        if (!model) return null;

        // Security Check: If it's a premium model, check if user has purchased
        const isPremium = model.exams?.some(e => e.isPremium);
        if (isPremium && userId) {
            const hasPurchased = await this.paymentsService.hasPurchased(userId, model.exams.find(e => e.isPremium)!.id);
            if (!hasPurchased) {
                // Return model metadata but NOT questions if not purchased? 
                // Or just throw error. Usually for test taking, we throw error.
                throw new Error('This is a premium mock test. Please purchase the exam to access it.');
            }
        }

        return model;
    }

    private async invalidateCache(examId?: string) {
        // Clear all list variations
        const keys = [
            'exams:all:all',
            'exams:all:real_exam',
            'exams:all:question_bank',
            'exams:all:admin:all',
            'exams:all:admin:real_exam',
            'exams:all:admin:question_bank'
        ];

        for (const key of keys) {
            await this.cacheService.del(key);
        }

        await this.cacheService.del('question-bank:stats');
        if (examId) {
            await this.cacheService.del(`exam:${examId}`);
        }
    }

    async updateExam(id: string, updateExamDto: UpdateExamDto) {
        await this.examsRepository.update(id, updateExamDto);
        await this.invalidateCache(id);
        return this.findOne(id);
    }



    // --- Hybrid Question Bank Methods ---

    /**
     * Get only global questions (examId = NULL)
     * These questions are available to all exams
     */
    async getGlobalQuestions(filters?: any, page: number = 1, limit: number = 50) {
        const query = this.questionRepository.createQueryBuilder('question')
            .leftJoin('question.exams', 'exams')
            .where('exams.id IS NULL') // Global questions have no exam links
            .leftJoinAndSelect('question.subject', 'subject')
            .leftJoinAndSelect('question.chapter', 'chapter')
            .leftJoinAndSelect('question.models', 'models')
            .orderBy('question.difficultyWeight', 'ASC')
            .take(limit)
            .skip((page - 1) * limit);

        if (filters?.subjectId) query.andWhere('subject.id = :subjectId', { subjectId: filters.subjectId });
        if (filters?.chapterId) query.andWhere('chapter.id = :chapterId', { chapterId: filters.chapterId });

        const [questions, total] = await query.getManyAndCount();
        return { questions, total, page, limit };
    }

    /**
     * Get exam-specific questions
     * These questions are exclusive to a particular exam
     */
    async getExamSpecificQuestions(examId: string, filters?: any, page: number = 1, limit: number = 50) {
        // Updated to use Many-to-Many logic: Join on questions.exams
        const query = this.questionRepository.createQueryBuilder('question')
            .leftJoinAndSelect('question.subject', 'subject')
            .leftJoinAndSelect('question.chapter', 'chapter')
            .leftJoinAndSelect('question.models', 'models')
            .leftJoinAndSelect('question.exams', 'exams')
            .where('exams.id = :examId', { examId })
            .orderBy('question.difficultyWeight', 'ASC')
            .take(limit)
            .skip((page - 1) * limit);

        if (filters?.subjectId) query.andWhere('subject.id = :subjectId', { subjectId: filters.subjectId });
        if (filters?.chapterId) query.andWhere('chapter.id = :chapterId', { chapterId: filters.chapterId });

        const [questions, total] = await query.getManyAndCount();
        return { questions, total, page, limit };
    }

    /**
     * Get all available questions for an exam (global + exam-specific)
     * Used when creating models or selecting questions for an exam
     */
    async getAvailableQuestionsForExam(examId: string, filters?: any) {
        const { questions: globalQuestions } = await this.getGlobalQuestions(filters, 1, 1000); // Fetch more for model selection
        const { questions: examSpecificQuestions } = await this.getExamSpecificQuestions(examId, filters, 1, 1000);
        return [...globalQuestions, ...examSpecificQuestions];
    }

    /**
     * Validate that a question can be used in a model
     * Prevents exam-specific questions from being used in wrong exams
     */
    async validateQuestionForModel(questionId: string, modelId: string): Promise<boolean> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            relations: ['exams']
        });

        if (!question) {
            throw new BadRequestException('Question not found');
        }

        // Global questions (no exams linked) can be used anywhere
        if (!question.exams || question.exams.length === 0) {
            return true;
        }

        // For exam-specific questions, verify the model belongs to one of those exams
        const model = await this.modelRepository.findOne({
            where: { id: modelId },
            relations: ['exams']
        });

        if (!model) {
            throw new BadRequestException('Model not found');
        }

        // Check intersection: Does the model belong to ANY exam that the question belongs to?
        const belongsToCommonExam = model.exams.some(
            modelExam => question.exams.some(qExam => qExam.id === modelExam.id)
        );

        if (!belongsToCommonExam) {
            // Get titles for helpful error message
            const qExamTitles = question.exams.map(e => e.title).join(', ');
            throw new BadRequestException(
                `Question is specific to "${qExamTitles}" and cannot be used in this model`
            );
        }

        return true;
    }

    /**
     * Get question bank statistics for admin dashboard
     */
    async getQuestionBankStats() {
        const cacheKey = 'question-bank:stats';
        // const cached = await this.cacheService.get<any>(cacheKey);
        // if (cached) return cached;

        const totalQuestions = await this.questionRepository.count();

        // Count questions with NO exams (Global)
        // This requires a left join and checking for null on the right side
        const globalQuestions = await this.questionRepository
            .createQueryBuilder('question')
            .leftJoin('question.exams', 'exams')
            .where('exams.id IS NULL')
            .getCount();

        const examSpecificQuestions = totalQuestions - globalQuestions;

        // Optimized: Count questions per exam via junction table
        const questionCounts = await this.questionRepository.manager
            .query(`
                SELECT "examId", COUNT("questionId") as count 
                FROM "exam_questions_question" 
                GROUP BY "examId"
            `);

        const exams = await this.examsRepository.find({ select: ['id', 'title'] });

        const examStats = exams.map(exam => {
            const stat = questionCounts.find((q: any) => q.examId === exam.id);
            return {
                examId: exam.id,
                examTitle: exam.title,
                specificQuestionCount: parseInt(stat?.count || '0')
            };
        });

        const stats = {
            total: totalQuestions,
            global: globalQuestions,
            examSpecific: examSpecificQuestions,
            byExam: examStats
        };

        await this.cacheService.set(cacheKey, stats, 3600); // Cache for 1 hour
        return stats;
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
    async create(createExamDto: CreateExamDto) {
        // Map 'name' to 'title' if title is missing (backward compatibility/frontend mismatch fix)
        // DTO ensures title is present, but let's keep logic safe
        const examData = {
            ...createExamDto,
            title: createExamDto.title,
        };

        if (!examData.title) {
            throw new BadRequestException('Exam title is required');
        }

        const exam = this.examsRepository.create(examData);
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
            exams: data.examId ? [{ id: data.examId }] : [] // Use exams array instead of examId column
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



    async onApplicationBootstrap() {
        // Repair orphaned questions (created via faulty seed script)
        const orphanedQuestions = await this.questionRepository
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.models', 'models')
            .leftJoinAndSelect('question.chapter', 'chapter')
            .leftJoinAndSelect('chapter.models', 'chapterModels') // Join models of the chapter
            .where('models.id IS NULL')
            .andWhere('question.chapterId IS NOT NULL')
            .getMany();

        if (orphanedQuestions.length > 0) {
            console.log(`[REPAIR] Found ${orphanedQuestions.length} orphaned questions. Attempting to link to models...`);
            let fixedCount = 0;

            for (const question of orphanedQuestions) {
                if (question.chapter && question.chapter.models && question.chapter.models.length > 0) {
                    // Start heuristically: Link to the first model in the chapter
                    // Ideally questions belong to specific models, but if lost, this is the best recovery
                    question.models = [question.chapter.models[0]];
                    await this.questionRepository.save(question);
                    fixedCount++;
                }
            }
            console.log(`[REPAIR] Successfully linked ${fixedCount} questions to models.`);

            // Invalidate cache
            await this.cacheService.del('question-bank:stats');
            await this.cacheService.del('exams:all');
        } else {
            console.log('[REPAIR] No orphaned questions found.');
        }
    }

    /**
     * Get full hierarchy: Exams -> Subjects -> Chapters with question counts
     */
    /**
     * Get full hierarchy: Exams -> Subjects -> Chapters with question counts
     * Optimized to avoid N+1 queries.
     */
    async getFullHierarchy(type?: ExamType) {
        // 1. Fetch entire hierarchy in one query
        const exams = await this.examsRepository.find({
            where: type ? { type } : {},
            relations: [
                'subjects',
                'subjects.chapters',
                'subjects.chapters.models',
                'subjects.chapters.models.exams' // Needed for examIds mapping
            ],
            order: { title: 'ASC' }
        });

        // 2. Fetch all question counts grouped by chapter in one aggregate query
        const questionCounts = await this.questionRepository
            .createQueryBuilder('question')
            .select('question.chapterId', 'chapterId')
            .addSelect('COUNT(question.id)', 'count')
            .groupBy('question.chapterId')
            .getRawMany();

        // Fetch question counts grouped by model (via junction table)
        const modelQuestionCounts = await this.questionRepository
            .createQueryBuilder('question')
            .innerJoin('question.models', 'model')
            .select('model.id', 'modelId')
            .addSelect('COUNT(question.id)', 'count')
            .groupBy('model.id')
            .getRawMany();

        // Convert counts to Maps for O(1) lookup
        const countsMap = new Map<string, number>();
        questionCounts.forEach(q => countsMap.set(q.chapterId, parseInt(q.count || '0')));

        const modelCountsMap = new Map<string, number>();
        modelQuestionCounts.forEach(m => modelCountsMap.set(m.modelId, parseInt(m.count || '0')));

        // 3. Transform data in memory
        return exams.map(exam => ({
            id: exam.id,
            name: exam.title,
            description: exam.description,
            subjects: (exam.subjects || []).map(subject => ({
                id: subject.id,
                name: subject.title,
                examId: exam.id,
                chapters: (subject.chapters || []).map(chapter => ({
                    id: chapter.id,
                    name: chapter.title,
                    subjectId: subject.id,
                    questionCount: countsMap.get(chapter.id) || 0,
                    models: (chapter.models || []).map(model => ({
                        id: model.id,
                        name: model.title,
                        totalQuestions: modelCountsMap.get(model.id) || 0,
                        chapterId: chapter.id,
                        examIds: model.exams?.map(e => e.id) || []
                    }))
                }))
            }))
        }));
    }

    async deleteExam(id: string) {
        await this.examsRepository.delete(id);
        await this.cacheService.del('exams:all');
        await this.cacheService.del(`exam:${id}`);
        return { message: 'Exam deleted successfully' };
    }

    // --- Question Bank Browser Methods ---

    async createQuestionsBulk(modelId: string, questionsData: any[]) {
        const model = await this.modelRepository.findOne({
            where: { id: modelId },
            relations: ['chapter', 'chapter.subject']
        });

        if (!model) throw new BadRequestException('Model not found');

        const questions: Question[] = [];

        for (const data of questionsData) {
            const [question] = this.questionRepository.create([{
                ...data,
                subject: model.chapter?.subject,
                chapter: model.chapter,
                models: [model],
                positiveMarks: data.positiveMarks || 1.0,
                negativeMarks: data.negativeMarks || 0.25,
            }]);
            questions.push(question);
        }

        const savedQuestions = await this.questionRepository.save(questions);

        // Update model question count
        const count = await this.questionRepository
            .createQueryBuilder('question')
            .leftJoin('question.models', 'model')
            .where('model.id = :modelId', { modelId })
            .getCount();

        model.totalQuestions = count;
        await this.modelRepository.save(model);

        await this.invalidateCache();

        // Background: Generate AI Explanations for new questions
        const questionIds = savedQuestions.map(q => q.id);
        this.explanationService.generateBulkExplanations(questionIds).catch(err => {
            console.error('[ExamsService] Background AI explanation generation failed:', err);
        });

        return savedQuestions;
    }

    async getQuestionBankModels() {
        // Get all exams that have models (effectively acting as banks)
        const questionBanks = await this.examsRepository.find({
            relations: ['subjects', 'subjects.chapters', 'subjects.chapters.models']
        });

        // Flatten to model list with hierarchy context
        const models = [];
        for (const bank of questionBanks) {
            for (const subject of bank.subjects || []) {
                for (const chapter of subject.chapters || []) {
                    for (const model of chapter.models || []) {
                        models.push({
                            id: model.id,
                            title: model.title,
                            totalQuestions: model.totalQuestions,
                            hierarchy: `${bank.title} → ${subject.title} → ${chapter.title}`,
                            bankId: bank.id,
                            subjectId: subject.id,
                            chapterId: chapter.id
                        });
                    }
                }
            }
        }

        return models;
    }

    async getModelQuestions(modelId: string) {
        // Find questions linked to this model via the model_questions junction table
        const model = await this.modelRepository.findOne({
            where: { id: modelId },
            relations: ['questions']
        });

        if (!model) {
            throw new BadRequestException('Model not found');
        }

        return model.questions.map(q => ({
            id: q.id,
            content: q.content,
            topic: q.topic,
            correctOptionId: q.correctOptionId,
            options: q.options,
            difficultyWeight: q.difficultyWeight
        }));
    }

    async linkQuestionsToExam(examId: string, questionIds: string[]) {
        const exam = await this.examsRepository.findOne({
            where: { id: examId },
            relations: ['questions']
        });

        if (!exam) {
            throw new BadRequestException('Exam not found');
        }

        const questions = await this.questionRepository.findByIds(questionIds);

        if (questions.length !== questionIds.length) {
            throw new BadRequestException('Some questions not found');
        }

        // Add to existing questions (union to avoid duplicates)
        const existingIds = new Set(exam.questions?.map(q => q.id) || []);
        const newQuestions = questions.filter(q => !existingIds.has(q.id));

        exam.questions = [...(exam.questions || []), ...newQuestions];

        await this.examsRepository.save(exam);

        // Invalidate cache
        await this.invalidateCache(examId);

        return {
            linked: newQuestions.length,
            total: exam.questions.length,
            skipped: questionIds.length - newQuestions.length
        };
    }

    async getPracticeQuestions(chapterId: string, limit: number = 10) {
        // Use RANDOM() for SQLite/Postgres. For MySQL it's RAND()
        // Assuming Postgres/SQLite based on probable stack (NestJS default often uses Postgres or SQLite for dev)
        // If TypeORM abstract, we might need a different approach or raw query.
        // But 'ORDER BY RANDOM()' is standard enough for now.
        return this.questionRepository
            .createQueryBuilder('question')
            .where('question.chapterId = :chapterId', { chapterId })
            .orderBy('RANDOM()')
            .take(limit)
            .getMany();
    }

    async unlinkQuestionsFromExam(examId: string, questionIds: string[]) {
        const exam = await this.examsRepository.findOne({
            where: { id: examId },
            relations: ['questions']
        });

        if (!exam) {
            throw new BadRequestException('Exam not found');
        }

        const beforeCount = exam.questions?.length || 0;
        exam.questions = (exam.questions || []).filter(q => !questionIds.includes(q.id));
        const afterCount = exam.questions.length;

        await this.examsRepository.save(exam);

        // Invalidate cache
        await this.invalidateCache(examId);

        return {
            unlinked: beforeCount - afterCount,
            remaining: afterCount
        };
    }

    // --- End of Service ---
}

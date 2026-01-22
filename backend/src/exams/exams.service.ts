import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Model } from './entities/model.entity';
import { Question } from './entities/question.entity';
import { PaymentsService } from '../payments/payments.service';
import { CacheService } from '../common/cache.service';

@Injectable()
export class ExamsService {
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
    ) { }

    async findAll() {
        const cacheKey = 'exams:all';
        const cached = await this.cacheService.get<Exam[]>(cacheKey);
        if (cached) return cached;

        const exams = await this.examsRepository.find({
            relations: ['models', 'models.chapter', 'models.chapter.subject']
        });

        await this.cacheService.set(cacheKey, exams, 3600);
        return exams;
    }

    async findOne(id: string) {
        const cacheKey = `exam:${id}`;
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) {
            console.log('Cache HIT for', id);
            return cached;
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
        await this.cacheService.del('exams:all');
        await this.cacheService.del('question-bank:stats');
        if (examId) {
            await this.cacheService.del(`exam:${examId}`);
        }
    }

    // --- Hybrid Question Bank Methods ---

    /**
     * Get only global questions (examId = NULL)
     * These questions are available to all exams
     */
    async getGlobalQuestions(filters?: any, page: number = 1, limit: number = 50) {
        const [questions, total] = await this.questionRepository.findAndCount({
            where: { examId: IsNull(), ...filters },
            relations: ['subject', 'chapter', 'models'],
            order: { difficultyWeight: 'ASC' },
            take: limit,
            skip: (page - 1) * limit
        });
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

        if (filters && filters.subjectId) query.andWhere('subject.id = :subjectId', { subjectId: filters.subjectId });
        if (filters.chapterId) query.andWhere('chapter.id = :chapterId', { chapterId: filters.chapterId });

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
        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

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
    async create(createExamDto: any) {
        // Map 'name' to 'title' if title is missing (backward compatibility/frontend mismatch fix)
        const examData = {
            ...createExamDto,
            title: createExamDto.title || createExamDto.name,
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

            // Validate exams if provided as IDs in rest.exams (via junction)
            if (rest.exams && rest.exams.length > 0) {
                for (const examData of rest.exams) {
                    const belongsToExam = model.exams?.some(exam => exam.id === examData.id);
                    if (!belongsToExam) {
                        throw new BadRequestException(
                            `Question with exam ID ${examData.id} cannot be added to this model`
                        );
                    }
                }
            }

            return {
                ...rest,
                models: [model],
                subject: model.chapter?.subject,
                chapter: model.chapter,
                exams: rest.exams || []
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

    /**
     * Get full hierarchy: Exams -> Subjects -> Chapters with question counts
     */
    async getFullHierarchy() {
        const exams = await this.examsRepository.find({
            relations: ['subjects', 'subjects.chapters'],
            order: { title: 'ASC' }
        });

        // Get question counts for each chapter
        const enrichedExams = await Promise.all(
            exams.map(async (exam) => ({
                id: exam.id,
                name: exam.title,
                description: exam.description,
                subjects: await Promise.all(
                    (exam.subjects || []).map(async (subject) => ({
                        id: subject.id,
                        name: subject.title,
                        examId: exam.id,
                        chapters: await Promise.all(
                            (subject.chapters || []).map(async (chapter) => {
                                const chapterWithModels = await this.chapterRepository.findOne({
                                    where: { id: chapter.id },
                                    relations: ['models']
                                });
                                const questionCount = await this.questionRepository.count({
                                    where: { chapter: { id: chapter.id } }
                                });
                                return {
                                    id: chapter.id,
                                    name: chapter.title,
                                    subjectId: subject.id,
                                    questionCount,
                                    models: (chapterWithModels?.models || []).map(model => ({
                                        id: model.id,
                                        name: model.title,
                                        totalQuestions: model.totalQuestions,
                                        chapterId: chapter.id,
                                        examIds: model.exams?.map(e => e.id) || []
                                    }))
                                };
                            })
                        )
                    }))
                )
            }))
        );

        return enrichedExams;
    }

    async createExam(examData: { name: string; description?: string }) {
        const exam = this.examsRepository.create({
            title: examData.name,
            description: examData.description
        });
        const saved = await this.examsRepository.save(exam);
        await this.cacheService.del('exams:all');
        return saved;
    }

    async updateExam(id: string, examData: { name?: string; description?: string }) {
        await this.examsRepository.update(id, {
            ...(examData.name && { title: examData.name }),
            ...(examData.description && { description: examData.description })
        });
        await this.cacheService.del('exams:all');
        await this.cacheService.del(`exam:${id}`);
        return this.findOne(id);
    }

    async deleteExam(id: string) {
        await this.examsRepository.delete(id);
        await this.cacheService.del('exams:all');
        await this.cacheService.del(`exam:${id}`);
        return { message: 'Exam deleted successfully' };
    }

    // --- End of Service ---
}

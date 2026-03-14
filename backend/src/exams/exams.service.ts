import { Injectable, BadRequestException, Inject, forwardRef, OnApplicationBootstrap, Logger, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Brackets } from 'typeorm';
import { User } from '../users/user.entity';
import { Exam, ExamType } from './entities/exam.entity';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Model } from './entities/model.entity';
import { Question } from './entities/question.entity';
import { Purchase } from './entities/purchase.entity';
import { Attempt } from './entities/attempt.entity';
import { Response } from './entities/response.entity';
import { PaymentsService } from '../payments/payments.service';
import { PassesService } from '../passes/passes.service';
import { CacheService } from '../common/cache.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateSubjectDto, CreateChapterDto, CreateModelDto } from '@erankup/shared';
import { ExplanationService } from '../ai/explanation.service';
import { AIService } from '../ai/ai.service';
import { UserRole } from '../users/user.entity';
import { isUUID } from '../common/utils';

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
        @InjectRepository(Purchase)
        private purchaseRepository: Repository<Purchase>,
        @InjectRepository(Attempt)
        private attemptRepository: Repository<Attempt>,
        @InjectRepository(Response)
        private responseRepository: Repository<Response>,
        @Inject(forwardRef(() => PaymentsService))
        private paymentsService: PaymentsService,
        @Inject(forwardRef(() => PassesService))
        private passesService: PassesService,
        private cacheService: CacheService,
        private explanationService: ExplanationService,
        private aiService: AIService,
    ) { }

    private mapChaptersFromModels(exam: Exam): any[] {
        const chaptersMap = new Map();
        const OTHERS_CHAPTER_ID = 'others-chapter-id'; // Unique ID for the "Others" chapter

        // [DEBUG]
        if (exam.subjects && exam.subjects.length > 0) {
            console.log(`[DEBUG-MAP] Exam ${exam.id} has ${exam.subjects.length} subjects.`);
            exam.subjects.forEach(s => {
                console.log(`   - Subject ${s.title}: ${s.chapters?.length || 0} chapters`);
            });
        }

        // 1. Map from direct models via exam.models
        if (exam.models && exam.models.length > 0) {
            exam.models.forEach(model => {
                const targetChapterId = model.chapter ? model.chapter.id : OTHERS_CHAPTER_ID;
                const targetChapter = model.chapter || { id: OTHERS_CHAPTER_ID, title: 'Others', description: 'Models not assigned to a specific chapter.' };

                if (!chaptersMap.has(targetChapterId)) {
                    chaptersMap.set(targetChapterId, {
                        ...targetChapter,
                        models: []
                    });
                }

                // [FIX] Inherit duration from exam if model has default (60)
                if (model.duration === 60 && exam.duration !== 60) {
                    (model as any).duration = exam.duration;
                }

                chaptersMap.get(targetChapterId).models.push(model);
            });
        }

        // 2. Map from hierarchy via exam.subjects
        if (exam.subjects && exam.subjects.length > 0) {
            exam.subjects.forEach(subject => {
                if (subject.chapters) {
                    subject.chapters.forEach(chapter => {
                        if (!chaptersMap.has(chapter.id)) {
                            // Initialize chapter without models if not already present
                            chaptersMap.set(chapter.id, {
                                ...chapter,
                                models: []
                            });
                        }
                    });
                }
            });
        }

        return Array.from(chaptersMap.values());
    }

    async findAll(options: { includeUnpublished?: boolean; type?: string; page?: number; limit?: number } = {}) {
        const { includeUnpublished = false, type, page, limit } = options;
        const isPaginated = page !== undefined && limit !== undefined;

        const cacheKey = includeUnpublished
            ? `exams:all:admin:${type || 'all'}:${page || 'nopage'}:${limit || 'nolimit'}:v8`
            : `exams:all:${type || 'all'}:${page || 'nopage'}:${limit || 'nolimit'}:v8`;

        console.log(`[DEBUG] findAll called with key: ${cacheKey}`);

        // const cached = await this.cacheService.get<any>(cacheKey);
        // if (cached) {
        //    console.log('[DEBUG] Returning cached result');
        //    return cached;
        // }

        const query = this.examsRepository.createQueryBuilder('exam')
            // Direct models relation
            .leftJoinAndSelect('exam.models', 'models')
            .leftJoinAndSelect('models.chapter', 'chapter')
            .leftJoinAndSelect('chapter.subject', 'subject')
            // Hierarchy relation (for Real Exams)
            .leftJoinAndSelect('exam.subjects', 'subjects')
            .leftJoinAndSelect('subjects.chapters', 'subjectChapters')
            // Count relations
            .loadRelationCountAndMap('exam.directQuestionCount', 'exam.questions');

        if (!includeUnpublished) {
            query.andWhere('exam.isPublished = :isPublished', { isPublished: true });
        }
        if (type) {
            query.andWhere('exam.type = :type', { type });
        }

        // Default sort to ensure consistent pagination
        query.orderBy('exam.createdAt', 'DESC');

        if (isPaginated) {
            const pageNum = parseInt(page.toString());
            const limitNum = parseInt(limit.toString());
            query.skip((pageNum - 1) * limitNum).take(limitNum);

            const [exams, total] = await query.getManyAndCount();

            // Transform exams to include chapters
            const transformedExams = exams.map(exam => {
                const chapters = this.mapChaptersFromModels(exam);

                // [FIX] Dynamically calculate duration for Chapter Tests on overview
                let duration = exam.duration;
                if (exam.type === 'chapter_wise_test' && duration === 60) {
                    const qCount = (exam as any).directQuestionCount || exam.questions?.length || 0;
                    if (qCount > 0) duration = qCount * 1; // 1 min per question
                }

                // [DEBUG] Logs kept for verification
                console.log(`[DEBUG] Exam "${exam.title}" (ID: ${exam.id}):`);
                console.log(`   - Mapped Chapters: ${chapters.length}`);
                return {
                    ...exam,
                    duration, // Apply calculated duration
                    chapters
                };
            });

            const result = {
                data: transformedExams,
                meta: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            };

            await this.cacheService.set(cacheKey, result, 300); // 5 minutes cache
            return result;
        } else {
            const exams = await query.getMany();
            // Transform exams to include chapters
            const transformedExams = exams.map(exam => {
                const chapters = this.mapChaptersFromModels(exam);

                // [FIX] Dynamically calculate duration for Chapter Tests on overview
                let duration = exam.duration;
                if (exam.type === 'chapter_wise_test' && duration === 60) {
                    // Get question count from direct relation or mapped query
                    const qCount = (exam as any).directQuestionCount || exam.questions?.length || 0;
                    if (qCount > 0) duration = qCount * 1;
                }

                console.log(`[DEBUG] Exam "${exam.title}" (ID: ${exam.id}):`);
                console.log(`   - Mapped Chapters: ${chapters.length}`);
                return {
                    ...exam,
                    duration, // Apply calculated duration
                    chapters
                };
            });
            await this.cacheService.set(cacheKey, transformedExams, 300);
            return transformedExams;
        }
    }

    async findOne(id: string, includeUnpublished: boolean = false) {
        const cacheKey = `exam:${id}`;
        // const cached = await this.cacheService.get<any>(cacheKey);
        // if (cached) {
        //     console.log('Cache HIT for', id);
        //     return cached;
        // }

        console.log('Cache MISS for', id);
        const exam = isUUID(id) ? await this.examsRepository.findOne({
            where: includeUnpublished ? { id } : { id, isPublished: true },
            relations: [
                'models',
                'models.chapter',
                'models.chapter.subject',
                // 'models.questions', // [OPTIMIZATION] Don't load questions for detail view
                // 'questions',        // [OPTIMIZATION] Don't load questions for detail view
                'subjects',
                'subjects.chapters'
            ]
        }) : null;

        if (exam) {
            console.log('Exam found:', exam.id, 'Models:', exam.models?.length);

            // [FIX] Transform structure to match frontend expectation (group models by chapter)
            const chapters = this.mapChaptersFromModels(exam);

            // Enhance models in each chapter with calculated fields/defaults
            chapters.forEach(chapter => {
                if (chapter.models) {
                    chapter.models.forEach((model: any) => {
                        const positiveMarks = model.positiveMarks ?? exam.defaultPositiveMarks ?? 1;
                        const negativeMarks = model.negativeMarks ?? exam.defaultNegativeMarks ?? 0;
                        const totalMarks = (model.totalQuestions || 0) * positiveMarks;
                        let duration = (model.duration === 60 && exam.duration !== 60) ? exam.duration : model.duration;

                        // [FIX] Dynamically calculate duration for Chapter Tests
                        // If it's a chapter wise test and still on the default 60, scale based on questions
                        if (exam.type === 'chapter_wise_test' && duration === 60) {
                            const qCount = model.totalQuestions || (model.questions ? model.questions.length : 0);
                            duration = qCount > 0 ? qCount * 1 : 60; // 1 minute per question
                        }

                        model.positiveMarks = positiveMarks;
                        model.negativeMarks = negativeMarks;
                        model.totalMarks = totalMarks;
                        model.duration = duration;
                    });
                }
            });

            console.log('Chapters found:', chapters.length);

            // [FIX] Attach chapters directly to the entity instance so it's not stripped by ClassSerializerInterceptor
            (exam as any).chapters = chapters;

            // [OPTIMIZATION] Question hydration removed from detail view.
            // Questions are hydrated in `findModel` which is called when the test actually starts.

            await this.cacheService.set(cacheKey, exam, 3600);
            return exam;
        }
        return exam;
    }

    async findLiveExams() {
        return this.examsRepository
            .createQueryBuilder('exam')
            .leftJoinAndSelect('exam.models', 'model')
            .where('exam.type = :type', { type: ExamType.LIVE_EXAM })
            .orderBy('exam.startTime', 'DESC')
            .getMany();
    }

    async findModel(id: string, userId?: string) {
        console.log(`\n============== [DEBUG] findModel START ==============`);
        console.log(`ID: ${id}`);
        console.log(`User: ${userId}`);

        // 1. Try finding as a specific Model first (only if valid UUID)
        let model = null;
        if (isUUID(id)) {
            model = await this.modelRepository.findOne({
                where: { id },
                relations: ['chapter', 'chapter.subject', 'questions', 'exams']
            });
        }

        if (!model) {
            console.log(`[DEBUG] findModel: Model NOT found for ${id}. Checking Exam fallback...`);
            // 2. Fallback: Check if it's an Exam ID (only if valid UUID)
            let exam = null;
            if (isUUID(id)) {
                exam = await this.examsRepository.findOne({
                    where: { id },
                    relations: ['questions', 'models', 'models.questions']
                });
            }

            if (exam) {
                console.log(`[DEBUG] findModel: Found Exam fallback: ${exam.title}`);

                // Aggregate questions if direct questions are missing
                let finalQuestions = exam.questions || [];
                if (finalQuestions.length === 0 && exam.models) {
                    const aggregated = new Map();
                    exam.models.forEach(m => {
                        if (m.questions) m.questions.forEach(q => aggregated.set(q.id, q));
                    });
                    finalQuestions = Array.from(aggregated.values());
                }

                // Transform Exam to look like a Model for the start page
                model = {
                    id: exam.id,
                    title: exam.title,
                    totalQuestions: finalQuestions.length,
                    duration: exam.duration || 60,
                    difficulty: 'medium', // Standard for full exams
                    positiveMarks: exam.defaultPositiveMarks || 1,
                    negativeMarks: exam.defaultNegativeMarks || 0,
                    totalMarks: finalQuestions.length * (exam.defaultPositiveMarks || 1),
                    allowCalculator: true,
                    allowReview: true,
                    allowSkip: true,
                    questions: finalQuestions,
                    exams: [exam]
                } as any;
            } else {
                console.log(`[DEBUG] findModel: No Exam found for ${id} either.`);
            }
        } else {
            console.log(`[DEBUG] findModel: Found direct Model: ${model.title}`);

            // [FIX] If model has default duration (60) but belongs to an exam with specific duration, inherit it.
            if (model.duration === 60 && model.exams && model.exams.length > 0) {
                const parentExam = model.exams[0];
                if (parentExam.duration && parentExam.duration !== 60) {
                    console.log(`[DEBUG] findModel: Inheriting duration ${parentExam.duration} from Exam ${parentExam.title}`);
                    model.duration = parentExam.duration;
                } else if (parentExam.type === 'chapter_wise_test') {
                    // [FIX] Dynamically calculate duration for Chapter Tests (1 min per question)
                    const qCount = model.questions?.length ?? 0;
                    if (qCount > 0) {
                        model.duration = qCount * 1;
                        console.log(`[DEBUG] findModel: Dynamically calculated duration ${model.duration} for Chapter Wise Test`);
                    }
                }
            }
        }

        if (!model) {
            console.log(`[DEBUG] findModel result: NULL`);
            console.log(`============== [DEBUG] findModel END ==============\n`);
            return null;
        }

        let isAdmin = false;
        if (userId) {
            const user = await this.examsRepository.manager.getRepository(User).findOneBy({ id: userId });
            isAdmin = user?.role === 'admin';
        }

        if (model.questions) {
            await this.hydrateQuestions(model.questions, isAdmin);
        }

        console.log(`[DEBUG] findModel result: ${model.title} (Q: ${model.questions?.length})`);
        console.log(`============== [DEBUG] findModel END ==============\n`);

        // Security Check: If it's a premium model, check if user has purchased or has pass
        const isPremium = (model.exams || []).some(e => e.isPremium);
        if (isPremium && userId) {
            console.log(`[DEBUG] findModel: Premium test detected. Checking purchase/pass...`);
            const premiumExam = model.exams.find(e => e.isPremium);

            const hasPurchased = await this.paymentsService.hasPurchased(userId, premiumExam!.id);
            const hasPass = await this.passesService.getCurrentPass(userId);

            if (!hasPurchased && !hasPass) {
                console.log(`[DEBUG] findModel: ACCESS DENIED for ${userId}`);
                throw new Error('This is a premium mock test. Please purchase the exam or a pass to access it.');
            }
            console.log(`[DEBUG] findModel: ACCESS GRANTED`);
        }

        return model;
    }

    async findAllChapters() {
        return this.chapterRepository.find({ relations: ['subject'] });
    }

    async findChaptersBySubject(subjectId: string) {
        return this.chapterRepository.find({
            where: { subject: { id: subjectId } },
            order: { title: 'ASC' }
        });
    }

    async findModelsByChapter(chapterId: string) {
        return this.modelRepository.find({
            where: { chapter: { id: chapterId } },
            order: { title: 'ASC' }
        });
    }

    async findOneChapter(id: string) {
        return this.chapterRepository.findOne({
            where: { id },
            relations: ['subject']
        });
    }

    private async invalidateCache(examId?: string) {
        // Clear all list variations using patterns to handle pagination keys
        await this.cacheService.invalidatePattern('exams:all:*');
        await this.cacheService.invalidatePattern('exams:hierarchy:*');

        await this.cacheService.del('question-bank:stats');
        if (examId) {
            await this.cacheService.del(`exam:${examId}`);
        }

        // Clear hierarchy caches
        await this.cacheService.invalidatePattern('exams:hierarchy:*');
    }

    async updateExam(id: string, updateExamDto: UpdateExamDto) {
        const exam = await this.examsRepository.findOne({ where: { id } });

        if (!exam) {
            throw new NotFoundException('Exam not found');
        }

        // ===== VALIDATION FOR UPDATES =====

        // Prevent publishing question banks
        if (exam.type === 'question_bank' && updateExamDto.isPublished) {
            throw new BadRequestException('Question banks cannot be published. They are used as a source for other exams.');
        }

        // Prevent changing type of published exams (data integrity)
        if (exam.isPublished && (updateExamDto as any).type && (updateExamDto as any).type !== exam.type) {
            throw new BadRequestException('Cannot change type of published exam. Unpublish first, then change type.');
        }

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
            .leftJoinAndSelect('question.subject', 'subject')
            .leftJoinAndSelect('question.chapter', 'chapter')
            .leftJoinAndSelect('question.models', 'models')
            // Join for exam filtering through the hierarchical path: Question → Subject → Exam
            .leftJoin('subject.exam', 'subjectExam')
            // Legacy relationships for backward compatibility
            .leftJoin('question.exams', 'exams')
            .leftJoin('models.exams', 'modelExams')
            .orderBy('question.difficultyWeight', 'ASC')
            .take(limit)
            .skip((page - 1) * limit);

        if (filters?.subjectId) query.andWhere('subject.id = :subjectId', { subjectId: filters.subjectId });
        if (filters?.chapterId) query.andWhere('chapter.id = :chapterId', { chapterId: filters.chapterId });
        if (filters?.modelId) query.andWhere('models.id = :modelId', { modelId: filters.modelId });

        // [FIX] Enhanced examId filter: Find questions linked to exam via:
        // 1. Subject → Exam (PRIMARY PATH - Subject belongs to Exam)
        // 2. Direct examId column (ManyToOne - legacy)
        // 3. exams ManyToMany junction table (legacy)
        // 4. models → exams junction (via Model entity)
        if (filters?.examId) {
            query.andWhere(new Brackets(qb => {
                qb.where('subjectExam.id = :examId', { examId: filters.examId })
                    .orWhere('question.examId = :examId', { examId: filters.examId })
                    .orWhere('exams.id = :examId', { examId: filters.examId })
                    .orWhere('modelExams.id = :examId', { examId: filters.examId });
            }));
        }

        if (filters?.difficulty) {
            const weight = filters.difficulty === 'easy' ? 0.3 : filters.difficulty === 'hard' ? 0.7 : 0.5;
            query.andWhere('question.difficultyWeight = :weight', { weight });
        }

        if (filters?.search) {
            query.andWhere(new Brackets(qb => {
                qb.where('question.content ILIKE :search', { search: `%${filters.search}%` })
                    .orWhere('question.topic ILIKE :search', { search: `%${filters.search}%` })
                    .orWhere('question.explanation ILIKE :search', { search: `%${filters.search}%` })
                    .orWhere('exams.title ILIKE :search', { search: `%${filters.search}%` })
                    .orWhere('chapter.title ILIKE :search', { search: `%${filters.search}%` })
                    .orWhere('subject.title ILIKE :search', { search: `%${filters.search}%` });
            }));
        }

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
     * Get all questions for a specific chapter
     * Used for Chapter Wise Practice
     * Security: Verifies user has access if the chapter belongs to a premium exam.
     */
    async getQuestionsByChapter(chapterId: string, userId: string) {
        // 1. Fetch chapter with its subject and exam hierarchy
        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId },
            relations: ['subject', 'subject.exam']
        });

        if (!chapter) throw new BadRequestException('Chapter not found');

        const exam = chapter.subject?.exam;

        // 2. Perform security check if exam is premium
        if (exam?.isPremium) {
            const user = await this.examsRepository.manager.getRepository(User).findOneBy({ id: userId });
            const isAdmin = user?.role === 'admin';

            if (!isAdmin) {
                const hasPurchased = await this.paymentsService.hasPurchased(userId, exam.id);
                const hasPass = await this.passesService.getCurrentPass(userId);

                if (!hasPurchased && !hasPass) {
                    throw new ForbiddenException('Access Denied. This chapter belongs to a premium exam.');
                }
            }
        }

        // 3. Return questions if allowed
        const questions = await this.questionRepository.find({
            where: { chapter: { id: chapterId } },
            relations: ['subject', 'chapter', 'models'],
            order: { difficultyWeight: 'ASC' }
        });

        const user = await this.examsRepository.manager.getRepository(User).findOneBy({ id: userId });
        const isAdmin = user?.role === 'admin';

        await this.hydrateQuestions(questions, isAdmin);
        return questions;
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
    async createSubject(data: CreateSubjectDto & { examId?: string }): Promise<Subject> {
        const subject = this.subjectRepository.create({
            title: data.title || data.name,
            description: data.description,
            icon: data.icon,
            exam: data.examId ? { id: data.examId } : undefined
        });

        if (!subject.title) {
            throw new BadRequestException('Subject title is required');
        }

        const saved = await this.subjectRepository.save(subject);
        await this.invalidateCache();
        return saved;
    }

    async findAllSubjects(): Promise<Subject[]> {
        return this.subjectRepository.find({ relations: ['chapters', 'exam'] });
    }

    async findSubjectsByExam(examId: string): Promise<Subject[]> {
        return this.subjectRepository.find({
            where: { exam: { id: examId } },
            relations: ['chapters'],
            order: { title: 'ASC' }
        });
    }

    async findOneSubject(id: string): Promise<Subject> {
        return this.subjectRepository.findOne({
            where: { id },
            relations: ['exam', 'chapters']
        });
    }

    async updateSubject(id: string, data: any): Promise<Subject> {
        const updateData: any = {};
        if (data.title || data.name) updateData.title = data.title || data.name;
        if (data.description) updateData.description = data.description;
        if (data.icon) updateData.icon = data.icon;
        if (data.examId) updateData.exam = { id: data.examId };

        await this.subjectRepository.update(id, updateData);
        await this.invalidateCache();
        return this.subjectRepository.findOneBy({ id });
    }

    async deleteSubject(id: string): Promise<any> {
        const subject = await this.subjectRepository.findOne({
            where: { id },
            relations: ['chapters']
        });

        // 1. Unlink Chapters from this subject (preserving them for reuse)
        if (subject?.chapters) {
            for (const chapter of subject.chapters) {
                await this.chapterRepository.update(chapter.id, { subject: null });
            }
        }

        // 2. Unlink Questions linked to this subject
        await this.questionRepository.update({ subject: { id } }, { subject: null } as any);

        const result = await this.subjectRepository.delete(id);
        await this.invalidateCache();
        return result;
    }

    // --- Exam Management ---
    async create(createExamDto: CreateExamDto) {
        const examData: any = {
            ...createExamDto,
        };

        // Backward compatibility: map 'name' to 'title' if title is missing
        if (!examData.title && (createExamDto as any).name) {
            examData.title = (createExamDto as any).name;
        }

        // ===== BASIC VALIDATION =====
        if (!examData.title) {
            throw new BadRequestException('Exam title is required');
        }

        // Check for duplicate title
        const existing = await this.examsRepository.findOne({ where: { title: examData.title } });
        if (existing) {
            throw new BadRequestException('Exam with this title already exists. Please choose a unique title.');
        }

        // ===== TYPE-SPECIFIC VALIDATION =====
        switch (examData.type) {
            case 'live_exam':
                // Live exams require start and end times
                if (!examData.startTime) {
                    throw new BadRequestException('Live exams require a start time');
                }
                if (!examData.endTime) {
                    throw new BadRequestException('Live exams require an end time');
                }

                const start = new Date(examData.startTime);
                const end = new Date(examData.endTime);
                const now = new Date();

                if (start >= end) {
                    throw new BadRequestException('End time must be after start time');
                }
                if (start < now) {
                    throw new BadRequestException('Start time cannot be in the past');
                }
                break;

            case 'chapter_wise_test':
                // Chapter-wise tests require a category (subject)
                if (!examData.category) {
                    throw new BadRequestException('Chapter-wise tests require a category (subject)');
                }
                break;

            case 'question_bank':
                // Question banks should never be published to students
                if (examData.isPublished) {
                    throw new BadRequestException('Question banks cannot be published. They are used as a source for other exams.');
                }
                // Force isPublished to false for safety
                examData.isPublished = false;
                break;

            case 'real_exam':
                // Enforce free quizzes (category contains "quiz")
                if (examData.category && examData.category.toLowerCase().includes('quiz')) {
                    if (examData.isPremium) {
                        throw new BadRequestException('Quizzes must be free (isPremium must be false)');
                    }
                    // Force isPremium to false for safety
                    examData.isPremium = false;
                }
                break;
        }

        // ===== GENERAL VALIDATION =====
        if (examData.duration !== undefined) {
            if (examData.duration < 5 || examData.duration > 300) {
                throw new BadRequestException('Duration must be between 5 and 300 minutes');
            }
        }

        if (examData.defaultPositiveMarks !== undefined) {
            if (examData.defaultPositiveMarks <= 0) {
                throw new BadRequestException('Positive marks must be greater than 0');
            }
        }

        if (examData.defaultNegativeMarks !== undefined) {
            if (examData.defaultNegativeMarks < 0) {
                throw new BadRequestException('Negative marks cannot be negative');
            }
        }

        const exam = this.examsRepository.create(examData);
        const saved = await this.examsRepository.save(exam);
        await this.invalidateCache();
        return saved;
    }

    async createChapter(data: any) {
        const subject = data.subjectId ? await this.subjectRepository.findOneBy({ id: data.subjectId }) : null;
        const chapter = this.chapterRepository.create({
            title: data.title || data.name,
            description: data.description,
            subject: subject || undefined
        });

        if (!chapter.title) {
            throw new BadRequestException('Chapter title is required');
        }
        const saved = await this.chapterRepository.save(chapter);
        await this.invalidateCache();
        return saved;
    }

    async updateChapter(id: string, data: any) {
        const updateData: any = {};
        if (data.title || data.name) updateData.title = data.title || data.name;
        if (data.description) updateData.description = data.description;
        if (data.subjectId) updateData.subject = { id: data.subjectId };

        await this.chapterRepository.update(id, updateData);
        await this.invalidateCache();
        return this.chapterRepository.findOneBy({ id });
    }

    async deleteChapter(chapterId: string) {
        // Find chapter with all its models
        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId },
            relations: ['models']
        });

        // 1. Unlink Questions linked to this chapter to avoid FK blocks
        await this.questionRepository.update({ chapter: { id: chapterId } }, { chapter: null } as any);

        // 2. Unlink Models from this chapter (preserving them for reuse)
        if (chapter?.models) {
            for (const model of chapter.models) {
                await this.modelRepository.update(model.id, { chapter: null });
            }
        }

        const result = await this.chapterRepository.delete(chapterId);
        await this.invalidateCache();
        return result;
    }

    async createModel(chapterId: string, data: any) {
        const chapter = await this.chapterRepository.findOne({ where: { id: chapterId } });
        const { exams, ...modelData } = data;

        const newModel = this.modelRepository.create({
            ...modelData,
            title: data.title || data.name,
            chapter
        });

        if (!(newModel as any).title) {
            throw new BadRequestException('Model title is required');
        }

        const savedModel = await this.modelRepository.save(newModel);

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
        } else {
            // [FIX] Still invalidate general caches (hierarchy, stats) even if no specific exam linked
            await this.invalidateCache();
        }

        return savedModel;
    }

    async updateModel(id: string, data: any) {
        const model = await this.modelRepository.findOne({ where: { id } });
        if (!model) throw new BadRequestException('Model not found');

        const updateData: any = {
            title: data.title || data.name || model.title,
            scheduledAt: data.scheduledAt ?? model.scheduledAt
        };

        Object.assign(model, updateData);
        const saved = await this.modelRepository.save(model);
        await this.invalidateCache();
        return saved;
    }

    async deleteModel(id: string) {
        const model = await this.modelRepository.findOne({
            where: { id },
            relations: ['questions', 'exams']
        });

        if (!model) throw new BadRequestException('Model not found');

        // 1. Unlink questions (questions can belong to multiple models)
        // ManyToMany relation: model.questions
        model.questions = [];
        await this.modelRepository.save(model);

        // 2. Unlink from exams
        model.exams = [];
        await this.modelRepository.save(model);

        // 3. Delete the model
        const result = await this.modelRepository.delete(id);
        await this.invalidateCache();
        return result;
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

        // Generate vector embedding for semantic search
        // const embedding = await this.aiService.generateEmbedding(data.content || data.questionText);

        // Link to hierarchy for bank categorization
        const questionData = {
            ...data,
            subject: model?.chapter?.subject,
            chapter: model?.chapter,
            models: [model],
            exams: data.examId ? [{ id: data.examId }] : [], // Use exams array instead of examId column
            // embedding
        };

        const question = this.questionRepository.create(questionData);
        await this.questionRepository.save(question);

        // Update Model Question Count
        await this.modelRepository.increment({ id: modelId }, 'totalQuestions', 1);

        // Invalidate Cache for all linked exams
        if (model && model.exams) {
            console.log(`[DEBUG] Found ${model.exams.length} exams to invalidate for model ${model.id}`);
            for (const exam of model.exams) {
                console.log(`[DEBUG] Invalidating cache for exam ${exam.id}`);
                await this.invalidateCache(exam.id);
            }
        } else if (model) {
            console.log(`[DEBUG] No exams found for model ${model.id} to invalidate.`);
        }

        return question;
    }



    async exportModelQuestionsToCSV(modelId: string): Promise<string> {
        const model = await this.modelRepository.findOne({
            where: { id: modelId },
            relations: ['questions', 'chapter', 'chapter.subject']
        });

        if (!model) throw new BadRequestException('Model not found');
        return this.formatQuestionsToCSV(model.questions, {
            chapterId: model.chapter?.id,
            subjectId: model.chapter?.subject?.id
        });
    }

    async exportExamQuestionsToCSV(examId: string): Promise<string> {
        const exam = await this.examsRepository.findOne({
            where: { id: examId },
            relations: [
                'questions',
                'questions.subject',
                'questions.chapter',
                'models',
                'models.questions',
                'models.questions.subject',
                'models.questions.chapter'
            ]
        });

        if (!exam) throw new BadRequestException('Exam not found');

        // Aggregate all unique questions
        const questionsMap = new Map<string, Question>();
        if (exam.questions) exam.questions.forEach(q => questionsMap.set(q.id, q));
        if (exam.models) {
            exam.models.forEach(model => {
                if (model.questions) model.questions.forEach(q => questionsMap.set(q.id, q));
            });
        }

        return this.formatQuestionsToCSV(Array.from(questionsMap.values()), {
            examId: exam.id
        });
    }

    private formatQuestionsToCSV(questions: Question[], hierarchy?: { examId?: string, subjectId?: string, chapterId?: string }): string {
        const baseHeaders = ['QuestionText', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectOption', 'Explanation', 'Topic', 'Difficulty', 'PositiveMarks', 'NegativeMarks', 'ImageUrl'];
        const metaHeaders = ['ExamID', 'ModelID', 'SubjectID', 'ChapterID'];
        const headers = [...baseHeaders, ...metaHeaders];

        const rows = questions.map(q => {
            const optionsMap: any = {};
            q.options?.forEach(opt => {
                optionsMap[`option${opt.id.toUpperCase()}`] = opt.text;
            });

            const data = [
                q.content,
                optionsMap.optionA || '',
                optionsMap.optionB || '',
                optionsMap.optionC || '',
                optionsMap.optionD || '',
                q.correctOptionId,
                q.explanation || '',
                q.topic || 'General',
                q.difficultyWeight <= 0.3 ? 'easy' : q.difficultyWeight >= 0.7 ? 'hard' : 'medium',
                q.positiveMarks,
                q.negativeMarks,
                q.imageUrl || '',
                hierarchy?.examId || q.examId || '',
                q.models?.map(m => m.id).join(';') || '',
                hierarchy?.subjectId || q.subject?.id || '',
                hierarchy?.chapterId || q.chapterId || q.chapter?.id || ''
            ];

            return data.map(val => {
                if (val === null || val === undefined) return '""';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            }).join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    async onApplicationBootstrap() {
        // Run heavy maintenance tasks in background to avoid blocking server start
        this.runBackgroundMaintenance().catch(err =>
            console.error('[BOOTSTRAP] Background maintenance failed:', err)
        );

        await this.invalidateCache();
    }

    private async runBackgroundMaintenance() {
        // 1. Sync Model Question Counts (Self-Healing)
        console.log('[BOOTSTRAP] Starting background model question count sync...');

        try {
            const counts = await this.modelRepository.createQueryBuilder('model')
                .leftJoin('model.questions', 'question')
                .select('model.id', 'modelId')
                .addSelect('COUNT(question.id)', 'count')
                .groupBy('model.id')
                .getRawMany();

            if (counts && counts.length > 0) {
                for (const row of counts) {
                    await this.modelRepository.update(row.modelId, { totalQuestions: parseInt(row.count) });
                }
                console.log(`[BOOTSTRAP] Updated question counts for ${counts.length} models.`);
            }
        } catch (error) {
            console.error('[BOOTSTRAP] Failed to sync model counts:', error);
        }

        // 2. Repair orphaned questions
        try {
            const orphanedQuestions = await this.questionRepository
                .createQueryBuilder('question')
                .leftJoinAndSelect('question.models', 'models')
                .leftJoinAndSelect('question.chapter', 'chapter')
                .leftJoinAndSelect('chapter.models', 'chapterModels')
                .where('models.id IS NULL')
                .andWhere('question.chapterId IS NOT NULL')
                .getMany();

            if (orphanedQuestions.length > 0) {
                console.log(`[REPAIR] Found ${orphanedQuestions.length} orphaned questions. Linking...`);
                let fixedCount = 0;

                for (const question of orphanedQuestions) {
                    if (question.chapter && question.chapter.models && question.chapter.models.length > 0) {
                        question.models = [question.chapter.models[0]];
                        await this.questionRepository.save(question);
                        fixedCount++;
                    }
                }
                console.log(`[REPAIR] Successfully linked ${fixedCount} questions.`);

                if (fixedCount > 0) {
                    // Re-sync counts
                    const newCounts = await this.modelRepository.createQueryBuilder('model')
                        .leftJoin('model.questions', 'question')
                        .select('model.id', 'modelId')
                        .addSelect('COUNT(question.id)', 'count')
                        .groupBy('model.id')
                        .getRawMany();

                    for (const row of newCounts) {
                        await this.modelRepository.update(row.modelId, { totalQuestions: parseInt(row.count) });
                    }
                }
            } else {
                console.log('[REPAIR] No orphaned questions found.');
            }
        } catch (error) {
            console.error('[REPAIR] Failed to repair orphaned questions:', error);
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
        const cacheKey = `exams:hierarchy:${type || 'all'}:v1`;
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) return cachedData;

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
        const hierarchy = exams.map(exam => ({
            id: exam.id,
            name: exam.title,
            title: exam.title,
            description: exam.description,
            subjects: (exam.subjects || []).map(subject => ({
                id: subject.id,
                name: subject.title,
                title: subject.title,
                examId: exam.id,
                chapters: (subject.chapters || []).map(chapter => ({
                    id: chapter.id,
                    name: chapter.title,
                    title: chapter.title,
                    subjectId: subject.id,
                    questionCount: countsMap.get(chapter.id) || 0,
                    models: (chapter.models || []).map(model => ({
                        id: model.id,
                        name: model.title,
                        title: model.title,
                        totalQuestions: modelCountsMap.get(model.id) || 0,
                        chapterId: chapter.id,
                        examIds: model.exams?.map(e => e.id) || []
                    }))
                }))
            }))
        }));

        // Cache for 10 minutes
        await this.cacheService.set(cacheKey, hierarchy, 600);
        return hierarchy;
    }

    async deleteExam(id: string) {
        // 1. Load full relations
        const exam = await this.examsRepository.findOne({
            where: { id },
            relations: ['subjects', 'subjects.chapters', 'subjects.chapters.models', 'questions', 'models']
        });

        if (!exam) return { message: 'Exam not found' };

        // 2. ❌ REMOVED: Delete Purchase records
        // Purchase is deprecated - passes are platform-level, not exam-specific
        // Student access is managed via UserPass, which is not tied to individual exams

        // 3. Delete ALL Attempts and Responses linked to this Exam (direct)
        const directAttempts = await this.attemptRepository.find({ where: { exam: { id } } });
        for (const att of directAttempts) {
            await this.responseRepository.delete({ attempt: { id: att.id } });
            await this.attemptRepository.delete(att.id);
        }

        // 4. (Skipped/Removed) We no longer delete attempts by model alone to preserve other exams/practice data.
        // Step 3 already cleared attempts scoped to this exam.

        // 5. Unlink Subjects from this exam
        if (exam.subjects) {
            for (const subject of exam.subjects) {
                await this.subjectRepository.update(subject.id, { exam: null });
            }
        }

        // 6. Unlink Questions from this exam
        // a) Unlink ManyToOne legacy reference
        await this.questionRepository.update({ exam: { id } }, { exam: null } as any);

        // b) Unlink ManyToMany references (junction table)
        if (exam.questions && exam.questions.length > 0) {
            await this.examsRepository
                .createQueryBuilder()
                .relation(Exam, 'questions')
                .of(id)
                .remove(exam.questions);
        }

        // 7. Unlink Models from this exam (junction table)
        if (exam.models && exam.models.length > 0) {
            await this.examsRepository
                .createQueryBuilder()
                .relation(Exam, 'models')
                .of(id)
                .remove(exam.models);
        }

        // 8. Delete the Exam entity
        await this.examsRepository.delete(id);

        await this.invalidateCache(id);
        return { message: 'Exam deleted successfully' };
    }


    // --- Question Bank Browser Methods ---
    async createQuestionsBulk(userId: string, role: UserRole, modelId: string | undefined, questionsData: any[], examId?: string, subjectId?: string) {
        const fs = require('fs');
        const path = require('path');
        const logFile = path.join(process.cwd(), 'bulk_upload_service.log');
        const log = (msg: string) => {
            const timestampedMsg = `${new Date().toISOString()} ${msg}`;
            console.log(timestampedMsg);
            try {
                fs.appendFileSync(logFile, timestampedMsg + '\n');
            } catch (e) {
                console.error('Failed to write to service log:', e.message);
            }
        };

        log(`[ExamsService] Bulk Upload: Received ${questionsData.length} questions. modelId: ${modelId}, examId: ${examId}`);

        let model: Model | null = null;

        if (modelId) {
            model = await this.modelRepository.findOne({
                where: { id: modelId },
                relations: ['chapter', 'chapter.subject']
            });
            if (!model) throw new BadRequestException('Model not found');
        }

        // --- Section resolution: build a map of section title -> Subject for this exam ---
        let sectionSubjectMap: Record<string, string> = {}; // title (lower) -> subjectId
        if (examId) {
            const subjects = await this.subjectRepository.find({
                where: { exam: { id: examId } },
                select: ['id', 'title']
            });
            subjects.forEach(s => {
                sectionSubjectMap[s.title.toLowerCase().trim()] = s.id;
            });
        }

        // 1. De-duplication: Check for existing questions
        // Normalize content (trim) to ensure accurate matching
        const contents = questionsData.map(data => (data.content || data.questionText || '').trim());

        // Find existing questions with these contents
        // Note: For very large batches, we might need to chunk this "IN" query.
        // Assuming typical batch size < 1000, this is safe.
        const existingQuestions = await this.questionRepository.find({
            where: { content: In(contents) }
        });

        const existingContentSet = new Set(existingQuestions.map(q => q.content.trim()));

        // Filter out duplicates and capture them
        const newQuestionsData: any[] = [];
        const existingRows: any[] = [];
        const seenInBatch = new Set<string>();

        questionsData.forEach(data => {
            const normalizedContent = (data.content || data.questionText || '').trim();
            if (existingContentSet.has(normalizedContent)) {
                existingRows.push({ ...data, error: 'Question already exists in database' });
            } else if (seenInBatch.has(normalizedContent)) {
                existingRows.push({ ...data, error: 'Duplicate question found within the same CSV file' });
            } else {
                seenInBatch.add(normalizedContent);
                newQuestionsData.push(data);
            }
        });

        log(`[ExamsService] Bulk Upload: Found ${existingRows.length} existing, Creating ${newQuestionsData.length} new.`);

        // [FIX] Image Repair: ALWAYS update existing questions with new images
        // This runs regardless of whether there are new questions or not
        let imageRepairCount = 0;
        for (const data of questionsData) {
            if (data.imageUrl) {
                const existing = existingQuestions.find(q => q.content.trim() === (data.content || data.questionText || '').trim());
                if (existing && !existing.imageUrl) {
                    existing.imageUrl = data.imageUrl;
                    await this.questionRepository.save(existing);
                    imageRepairCount++;
                    log(`[ExamsService] Repaired image for question ${existing.id}`);
                }
            }
        }

        if (imageRepairCount > 0) {
            log(`[ExamsService] Image Repair: Updated ${imageRepairCount} existing questions with images.`);
        }

        if (newQuestionsData.length === 0) {
            // All questions already exist, return them (possibly with repaired images)
            log('[ExamsService] All questions already exist. Returning existing questions.');
            return {
                createdCount: 0,
                existingRows: existingRows,
                total: existingRows.length
            };
        }

        // 2. Extract content for batch embedding (only for NEW questions)
        const newContents = newQuestionsData.map(data => data.content || data.questionText);
        let embeddings: number[][] = [];

        try {
            embeddings = await this.aiService.generateEmbeddingsBatch(newContents);
        } catch (err) {
            console.error(`[ExamsService] Batch embedding failed, falling back to empty:`, err.message);
        }

        const questions: Question[] = [];

        // 3. Map data and join with embeddings
        for (let i = 0; i < newQuestionsData.length; i++) {
            const data = newQuestionsData[i];
            const content = (data.content || data.questionText || '').trim();

            // Critical Validation: Skip if content is missing
            if (!content) {
                console.warn(`[ExamsService] Skipping question ${i} due to missing content.`);
                continue;
            }

            const questionData: any = {
                ...data,
                content: content,
                positiveMarks: data.positiveMarks || 1.0,
                negativeMarks: data.negativeMarks || 0.25,
                // embedding: (embeddings[i] && embeddings[i].length === 768) ? embeddings[i] : null
            };

            // Link to hierarchy if model exists
            if (model) {
                questionData.subject = model.chapter?.subject;
                questionData.chapter = model.chapter;
                questionData.models = [model];
            } else {
                questionData.models = [];
            }

            // Explicit examId linking override
            if (examId) {
                if (!questionData.exams) questionData.exams = [];
                if (!questionData.exams.some((e: any) => e.id === examId)) {
                    questionData.exams.push({ id: examId });
                }
            }

            // === Section/Subject resolution ===
            // Priority: explicit subjectId > CSV section name (resolved by map) > model's subject
            const resolvedSubjectId =
                subjectId ||
                (data.section ? sectionSubjectMap[data.section.toLowerCase().trim()] : undefined) ||
                (model?.chapter?.subject?.id);

            if (resolvedSubjectId) {
                questionData.subjectId = resolvedSubjectId;
                questionData.subject = { id: resolvedSubjectId };
            }

            try {
                const question = this.questionRepository.create(questionData);
                questions.push(question as unknown as Question);
            } catch (err) {
                console.error(`[ExamsService] Failed to create question entity for item ${i}:`, err.message);
            }
        }

        if (questions.length === 0) {
            log('[ExamsService] No valid questions to save after filtering and validation.');
            return {
                createdCount: 0,
                existingRows: existingRows,
                total: existingRows.length
            };
        }

        let savedQuestions: Question[] = [];
        try {
            log(`[ExamsService] Final Repository Save for ${questions.length} questions...`);
            savedQuestions = await this.questionRepository.save(questions);
            log(`[ExamsService] Save complete. Imported: ${savedQuestions.length}`);
        } catch (dbError) {
            log(`[ExamsService] FATAL: Database save failed: ${dbError.message}`);
            // If it's a constraint violation or mapping error, we want to know why
            throw new InternalServerErrorException(`Failed to save questions to database: ${dbError.message}`);
        }

        // Return combined list (Existing + Newly Saved)
        const finalResult = [...existingQuestions, ...savedQuestions];

        // Update model question count if model exists
        if (model) {
            const count = await this.questionRepository
                .createQueryBuilder('question')
                .leftJoin('question.models', 'model')
                .where('model.id = :modelId', { modelId: model.id })
                .getCount();

            model.totalQuestions = count;
            await this.modelRepository.save(model);
        }

        await this.invalidateCache(examId);

        // Background: Generate AI Explanations ONLY for new questions
        if (savedQuestions.length > 0) {
            const questionIds = savedQuestions.map(q => q.id);
            this.explanationService.generateBulkExplanations(userId, role, questionIds).catch(err => {
                console.error('[ExamsService] Background AI explanation generation failed:', err);
            });
        }

        return {
            createdCount: savedQuestions.length,
            existingRows: existingRows,
            total: savedQuestions.length + existingRows.length
        };
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

    async getPracticeQuestions(userId: string, chapterId: string, limit: number = 10) {
        // 1. Fetch chapter and its exam to check premium status
        const chapter = await this.chapterRepository.findOne({
            where: { id: chapterId },
            relations: ['subject', 'subject.exam']
        });

        if (!chapter) throw new NotFoundException('Chapter not found');

        const exam = chapter.subject?.exam;

        // 2. Perform security check if exam is premium
        if (exam?.isPremium) {
            const hasPurchased = await this.paymentsService.hasPurchased(userId, exam.id);
            const hasPass = await this.passesService.getActivePass(userId);

            if (!hasPurchased && !hasPass) {
                throw new ForbiddenException('Access Denied. This chapter belongs to a premium exam.');
            }
        }

        const take = typeof limit === 'string' ? parseInt(limit) : limit;
        return this.questionRepository
            .createQueryBuilder('question')
            .where('question.chapterId = :chapterId', { chapterId })
            .orderBy('RANDOM()')
            .take(take)
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

    async deleteQuestion(id: string) {
        // 1. Find question with relations
        const question = await this.questionRepository.findOne({
            where: { id },
            relations: ['models', 'exams']
        });

        if (!question) {
            throw new BadRequestException('Question not found');
        }

        // 2. Unlink from Models (Junction Table)
        if (question.models && question.models.length > 0) {
            await this.questionRepository
                .createQueryBuilder()
                .relation(Question, 'models')
                .of(id)
                .remove(question.models);
        }

        // 3. Unlink from Exams (Junction Table)
        if (question.exams && question.exams.length > 0) {
            await this.questionRepository
                .createQueryBuilder()
                .relation(Question, 'exams')
                .of(id)
                .remove(question.exams);
        }

        // 4. Delete Question
        await this.questionRepository.delete(id);

        await this.invalidateCache();
        return { message: 'Question deleted successfully' };
    }

    async deleteModelQuestions(modelId: string) {
        const model = await this.modelRepository.findOne({
            where: { id: modelId },
            relations: ['questions', 'questions.models', 'questions.exams']
        });

        if (!model) throw new BadRequestException('Model not found');

        const questionsToDelete = model.questions;
        const count = questionsToDelete.length;

        if (count === 0) return { message: 'No questions to delete', count: 0 };

        // Optimization: Use QueryBuilder for bulk deletion to handle relations efficiently
        const questionIds = questionsToDelete.map(q => q.id);

        // 1. Unlink from ALL models (including this one) in junction table
        await this.questionRepository
            .createQueryBuilder()
            .relation(Question, 'models')
            .of(questionIds)
            .remove(questionsToDelete.flatMap(q => q.models)); // Remove all model links

        // 2. Unlink from ALL exams in junction table
        await this.questionRepository
            .createQueryBuilder()
            .relation(Question, 'exams')
            .of(questionIds)
            .remove(questionsToDelete.flatMap(q => q.exams)); // Remove all exam links

        // 3. Delete the questions themselves
        await this.questionRepository.delete(questionIds);

        // 4. Update model to reflect empty questions (though relations are gone)
        model.questions = [];
        await this.modelRepository.save(model);

        await this.invalidateCache();
        return { message: `Successfully deleted ${count} questions from model`, count };
    }
    /**
     * Unified Question Hydration
     * Ensures all platforms (Web, Mobile, Admin) see the same audited explanations.
     */
    async hydrateQuestions(questions: Question[], isAdmin: boolean, contextExamId?: string) {
        if (!questions || questions.length === 0) return;

        const questionIds = questions.map(q => q.id);
        const explanations = await this.explanationService.getUnifiedExplanationsBulk(questionIds, contextExamId, isAdmin);

        for (const q of questions) {
            if (explanations[q.id]) {
                q.explanation = explanations[q.id];
            }
        }
    }
}

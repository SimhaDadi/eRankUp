import { Injectable, BadRequestException, Inject, forwardRef, OnApplicationBootstrap, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
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

    async findAll(options: { includeUnpublished?: boolean; type?: string; page?: number; limit?: number } = {}) {
        const { includeUnpublished = false, type, page, limit } = options;
        const isPaginated = page !== undefined && limit !== undefined;

        const cacheKey = includeUnpublished
            ? `exams:all:admin:${type || 'all'}:${page || 'nopage'}:${limit || 'nolimit'}:v6`
            : `exams:all:${type || 'all'}:${page || 'nopage'}:${limit || 'nolimit'}:v6`;

        const cached = await this.cacheService.get<any>(cacheKey);
        if (cached) return cached;

        const query = this.examsRepository.createQueryBuilder('exam')
            .leftJoinAndSelect('exam.models', 'models')
            .leftJoinAndSelect('models.chapter', 'chapter')
            .leftJoinAndSelect('chapter.subject', 'subject')
            .loadRelationCountAndMap('exam.directQuestionCount', 'exam.questions');

        if (!includeUnpublished) {
            query.andWhere('exam.isPublished = :isPublished', { isPublished: true });
        }
        if (type && type !== 'all') {
            query.andWhere('exam.type = :type', { type });
        }

        // Default sort to ensure consistent pagination
        query.orderBy('exam.createdAt', 'DESC');

        if (isPaginated) {
            query.skip((page - 1) * limit!)
                .take(limit);

            const [exams, total] = await query.getManyAndCount();

            const result = {
                data: exams,
                meta: {
                    total,
                    page: +page,
                    limit: +limit,
                    totalPages: Math.ceil(total / limit!)
                }
            };

            await this.cacheService.set(cacheKey, result, 300);
            return result;
        }

        const exams = await query.getMany();

        // [FIX] Reduced TTL to 5m (300s) to avoid stale data issues
        await this.cacheService.set(cacheKey, exams, 300);
        return exams;
    }

    async findOne(id: string, includeUnpublished: boolean = false) {
        const cacheKey = `exam:${id}`;
        // const cached = await this.cacheService.get<any>(cacheKey);
        // if (cached) {
        //     console.log('Cache HIT for', id);
        //     return cached;
        // }

        console.log('Cache MISS for', id);
        const exam = await this.examsRepository.findOne({
            where: includeUnpublished ? { id } : { id, isPublished: true },
            relations: [
                'models',
                'models.chapter',
                'models.chapter.subject',
                'models.questions', // [FIX] Fetch nested questions
                'questions' // Fetch direct questions
            ]
        });

        if (exam) {
            console.log('Exam found:', exam.id, 'Models:', exam.models?.length);

            // [FIX] Aggregate questions from all models if direct questions are empty
            if ((!exam.questions || exam.questions.length === 0) && exam.models) {
                const aggregatedQuestions = new Map<string, Question>();

                for (const model of exam.models) {
                    if (model.questions) {
                        model.questions.forEach(q => aggregatedQuestions.set(q.id, q));
                    }
                }

                if (aggregatedQuestions.size > 0) {
                    console.log(`[FIX] Aggregated ${aggregatedQuestions.size} questions from models for Exam ${exam.id}`);
                    exam.questions = Array.from(aggregatedQuestions.values());
                }
            }

            // Transform structure to match frontend expectation (group models by chapter)
            const chaptersMap = new Map();

            if (exam.models) {
                exam.models.forEach(model => {
                    console.log(`[DEBUG] Exam ${exam.id} Model ${model.id} totalQuestions: ${model.totalQuestions}`);

                    // Enhance model with calculated fields and exam defaults
                    const positiveMarks = model.positiveMarks ?? exam.defaultPositiveMarks ?? 1;
                    const negativeMarks = model.negativeMarks ?? exam.defaultNegativeMarks ?? 0;
                    const totalMarks = model.totalQuestions * positiveMarks;

                    // Add calculated fields to model
                    (model as any).positiveMarks = positiveMarks;
                    (model as any).negativeMarks = negativeMarks;
                    (model as any).totalMarks = totalMarks;

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

        // 1. Try finding as a specific Model first
        let model = await this.modelRepository.findOne({
            where: { id },
            relations: ['chapter', 'chapter.subject', 'questions', 'exams']
        });

        if (!model) {
            console.log(`[DEBUG] findModel: Model NOT found for ${id}. Trying Exam fallback...`);
            // 2. Fallback: Check if it's an Exam ID
            const exam = await this.examsRepository.findOne({
                where: { id },
                relations: ['questions', 'models', 'models.questions']
            });

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
        }

        if (!model) {
            console.log(`[DEBUG] findModel result: NULL`);
            console.log(`============== [DEBUG] findModel END ==============\n`);
            return null;
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

    async findOneChapter(id: string) {
        return this.chapterRepository.findOne({
            where: { id },
            relations: ['subject']
        });
    }

    private async invalidateCache(examId?: string) {
        // Clear all list variations
        const keys = [
            'exams:all:all:v6',
            'exams:all:real_exam:v6',
            'exams:all:previous_year_paper:v6',
            'exams:all:question_bank:v6',
            'exams:all:admin:all:v6',
            'exams:all:admin:real_exam:v6',
            'exams:all:admin:previous_year_paper:v6',
            'exams:all:admin:question_bank:v6'
        ];

        for (const key of keys) {
            await this.cacheService.del(key);
        }

        await this.cacheService.del('question-bank:stats');
        if (examId) {
            await this.cacheService.del(`exam:${examId}`);
        }

        // Clear hierarchy caches
        await this.cacheService.invalidatePattern('exams:hierarchy:*');
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
            // .where('exams.id IS NULL') -- REMOVED to support searching all questions
            .leftJoinAndSelect('question.subject', 'subject')
            .leftJoinAndSelect('question.chapter', 'chapter')
            .leftJoinAndSelect('question.models', 'models')
            .orderBy('question.difficultyWeight', 'ASC')
            .take(limit)
            .skip((page - 1) * limit);

        if (filters?.subjectId) query.andWhere('subject.id = :subjectId', { subjectId: filters.subjectId });
        if (filters?.chapterId) query.andWhere('chapter.id = :chapterId', { chapterId: filters.chapterId });

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
        return this.questionRepository.find({
            where: { chapter: { id: chapterId } },
            relations: ['subject', 'chapter', 'models'],
            order: { difficultyWeight: 'ASC' }
        });
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

    async findAllSubjects() {
        return this.subjectRepository.find({ relations: ['chapters', 'exam'] });
    }

    async findSubjectsByExam(examId: string) {
        return this.subjectRepository.find({
            where: { exam: { id: examId } },
            relations: ['chapters'],
            order: { title: 'ASC' }
        });
    }

    async findOneSubject(id: string) {
        return this.subjectRepository.findOne({
            where: { id },
            relations: ['exam', 'chapters']
        });
    }

    async updateSubject(id: string, data: any) {
        const updateData: any = {};
        if (data.title || data.name) updateData.title = data.title || data.name;
        if (data.description) updateData.description = data.description;
        if (data.icon) updateData.icon = data.icon;
        if (data.examId) updateData.exam = { id: data.examId };

        await this.subjectRepository.update(id, updateData);
        await this.invalidateCache();
        return this.subjectRepository.findOneBy({ id });
    }

    async deleteSubject(id: string) {
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

        if (!examData.title) {
            throw new BadRequestException('Exam title is required');
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
        const embedding = await this.aiService.generateEmbedding(data.content || data.questionText);

        // Link to hierarchy for bank categorization
        const questionData = {
            ...data,
            subject: model?.chapter?.subject,
            chapter: model?.chapter,
            models: [model],
            exams: data.examId ? [{ id: data.examId }] : [], // Use exams array instead of examId column
            embedding
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
        const baseHeaders = ['content', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionId', 'explanation', 'topic', 'difficultyWeight', 'positiveMarks', 'negativeMarks'];
        const metaHeaders = ['examId', 'subjectId', 'chapterId'];
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
                q.difficultyWeight,
                q.positiveMarks,
                q.negativeMarks,
                hierarchy?.examId || q.examId || '',
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

    async createQuestionsBulk(userId: string, role: UserRole, modelId: string | undefined, questionsData: any[], examId?: string) {
        let model: Model | null = null;

        if (modelId) {
            model = await this.modelRepository.findOne({
                where: { id: modelId },
                relations: ['chapter', 'chapter.subject']
            });
            if (!model) throw new BadRequestException('Model not found');
        }

        // 1. Extract content for batch embedding
        const contents = questionsData.map(data => data.content || data.questionText);
        let embeddings: number[][] = [];

        try {
            embeddings = await this.aiService.generateEmbeddingsBatch(contents);
        } catch (err) {
            console.error(`[ExamsService] Batch embedding failed, falling back to empty:`, err.message);
        }

        const questions: Question[] = [];

        // 2. Map data and join with embeddings
        for (let i = 0; i < questionsData.length; i++) {
            const data = questionsData[i];
            const questionData: any = {
                ...data,
                positiveMarks: data.positiveMarks || 1.0,
                negativeMarks: data.negativeMarks || 0.25,
                embedding: embeddings[i] || null
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

            const question = this.questionRepository.create(questionData);
            questions.push(question as unknown as Question);
        }

        const savedQuestions = await this.questionRepository.save(questions);

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

        // Background: Generate AI Explanations
        const questionIds = savedQuestions.map(q => q.id);
        this.explanationService.generateBulkExplanations(userId, role, questionIds).catch(err => {
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
}

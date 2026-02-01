import { PremiumGuard } from '../payments/guards/premium.guard';
import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete, Put, UseInterceptors, UploadedFile, BadRequestException, Inject, forwardRef, Query, ForbiddenException, ClassSerializerInterceptor, SerializeOptions, Res } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamsService } from './exams.service';
import { ExamsSeederService } from './exams-seeder.service';
import { ScorerService } from './scorer.service';
import { QuestionsUploadService } from './services/questions-upload.service';
import { PaymentsService } from '../payments/payments.service';
import { PassesService } from '../passes/passes.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestSessionService } from '../test-session/test-session.service';
import { UserRole } from '@erankup/shared';
import { CreateExamDto, UpdateExamDto, CreateSubjectDto, UpdateSubjectDto, CreateChapterDto, UpdateChapterDto, CreateModelDto, BulkCreateQuestionsDto } from '@erankup/shared';

import { SystemLockdownGuard } from '../common/guards/system-lockdown.guard';

@Controller('exams')
@UseGuards(SystemLockdownGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExamsController {
    constructor(
        private readonly examsService: ExamsService,
        private readonly scorerService: ScorerService,
        private readonly paymentsService: PaymentsService,
        @Inject(forwardRef(() => TestSessionService))
        private readonly testSessionService: TestSessionService,
        private readonly seederService: ExamsSeederService,
        private readonly uploadService: QuestionsUploadService,
        private readonly passesService: PassesService,
    ) { }


    @UseGuards(AuthGuard('jwt'))
    @Get()
    async findAll(@Request() req: any, @Query('type') type?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        const isAdmin = req.user.role === 'admin';
        const userId = req.user.userId;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;

        // Concurrent fetching of base data
        const [result, attemptStats, activeSessions, purchasedExamIds, activePasses] = await Promise.all([
            this.examsService.findAll({ includeUnpublished: isAdmin, type, page: pageNum, limit: limitNum }),
            this.scorerService.getUserExamStats(userId),
            this.testSessionService.getUserActiveSessions(userId),
            this.paymentsService.getPurchasedExamIds(userId),
            this.passesService.getActivePasses(userId) // [FIX] Fetch once to avoid N+1 queries
        ]);

        let exams: any[]; // Using any[] to allow attachment of extra props
        let meta: any = null;

        if (Array.isArray(result)) {
            exams = result;
        } else {
            exams = result.data;
            meta = result.meta;
        }

        const purchasedSet = new Set(purchasedExamIds);

        for (const exam of exams) {
            if (exam.isPremium) {
                const hasDirectlyPurchased = purchasedSet.has(exam.id);
                // [FIX] Pass pre-fetched activePasses
                const hasPassAccess = await this.passesService.canAccessExam(userId, exam.id, (exam as any).type, activePasses);
                (exam as any).hasPurchased = hasDirectlyPurchased || hasPassAccess;
            }

            // Calculate aggregated stats
            const modelCount = exam.models?.reduce((acc: any, m: any) => acc + (m.totalQuestions || 0), 0) || 0;
            const directCount = (exam as any).directQuestionCount || 0;
            (exam as any).questionCount = Math.max(modelCount, directCount);

            const uniqueChapters = new Set(exam.models?.map((m: any) => m.chapter?.id).filter((id: any) => !!id));
            (exam as any).chapters = Array.from(uniqueChapters).map(id => ({ id }));

            // Attach attempts stats
            if (attemptStats[exam.id]) {
                const stats = attemptStats[exam.id];
                (exam as any).attempts = {
                    count: stats.count,
                    latestAttemptId: stats.latestAttemptId,
                    bestScore: stats.bestScore,
                    latestScore: stats.latestScore
                };
            }

            // Check for active session
            const examModelIds = exam.models?.map((m: any) => m.id) || [];
            const allRelevantIds = [...examModelIds, exam.id];
            const activeId = allRelevantIds.find(id => activeSessions[id]);
            (exam as any).activeSession = activeId ? { id: activeId, status: activeSessions[activeId] } : null;

            // Calculate total models for progress tracking
            let totalModels = examModelIds.length;
            if (totalModels === 0 && (exam as any).type === 'real_exam') {
                totalModels = 1;
            }
            (exam as any).totalModels = totalModels;
        }

        if (meta) {
            return { data: exams, meta };
        }
        return exams;
    }

    @Get('live')
    async findLiveExams() {
        return this.examsService.findLiveExams();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('seed-ssc-2026')
    async seedSSC() {
        return this.seederService.seedSSC2026();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('seed-ssc-2027')
    async seedSSC2027() {
        return this.seederService.seedSSC2027();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('seed-ssc-2028')
    async seedSSC2028() {
        return this.seederService.seedSSC2028();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('seed-2030')
    async seed2030() {
        return this.seederService.seed2030Exams();
    }


    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('hierarchy')
    async getHierarchy(@Request() req: any) {
        const type = req.query.type;
        return this.examsService.getFullHierarchy(type);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        const isAdmin = req.user.role === 'admin';
        const exam = await this.examsService.findOne(id, isAdmin);

        if (!exam) return exam;

        if (exam.isPremium && !isAdmin) {
            const hasPurchased = await this.paymentsService.hasPurchased(req.user.userId, exam.id);
            const hasPassAccess = await this.passesService.canAccessExam(req.user.userId, exam.id, (exam as any).type);

            (exam as any).hasPurchased = hasPurchased || hasPassAccess;

            // GATEKEEPER: If no purchase AND no active pass -> Deny details (or restricted view)
            // For now, we return data but client handles it? 
            // User requested strict access: "Gain access to test series"
            // If we throw error, they can't even see the exam details page to buy it.
            // BETTER: Return exam but flag it isLocked? Access to QUESTIONS (getModel) should be the hard gate.
            // Let's implement the hard gate in `getModel` endpoint which returns the content.
        }
        return exam;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('models/:id')
    async getModel(@Param('id') id: string, @Request() req: any) {
        const isAdmin = req.user.role === 'admin';

        // Use existing findModel which fetches relationships
        const model = await this.examsService.findModel(id, req.user.userId);
        if (!model) return model;

        // Check if any associated Exam is Premium
        // findModel loads 'exams' relation
        const premiumExam = model.exams?.find(e => e.isPremium);

        if (premiumExam && !isAdmin) {
            const hasPurchased = await this.paymentsService.hasPurchased(req.user.userId, premiumExam.id);
            const hasPass = await this.passesService.getCurrentPass(req.user.userId);

            if (!hasPurchased && !hasPass) {
                throw new ForbiddenException('Access Denied. Premium Pass or Purchase required.');
            }
        }

        return model;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post()
    create(@Body() createExamDto: CreateExamDto) {
        return this.examsService.create(createExamDto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateExamDto: UpdateExamDto) {
        return this.examsService.updateExam(id, updateExamDto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put(':id/publish')
    async togglePublish(@Param('id') id: string, @Body('isPublished') isPublished: boolean) {
        return this.examsService.updateExam(id, { isPublished });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('models/:modelId/bulk-upload')
    @UseInterceptors(FileInterceptor('file'))
    async bulkUploadToModel(
        @Request() req: any,
        @Param('modelId') modelId: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) throw new BadRequestException('No file uploaded');

        const parsedQuestions = await this.uploadService.parseExamsFile(file.buffer, file.mimetype);

        const questionsData = parsedQuestions.map(q => ({
            content: q.content,
            options: q.options,
            correctOptionId: q.correctOptionId,
            explanation: q.explanation,
            topic: q.topic,
            difficultyWeight: q.difficultyWeight || 0.5,
            positiveMarks: q.positiveMarks,
            negativeMarks: q.negativeMarks
        }));

        const result = await this.examsService.createQuestionsBulk(req.user.userId, req.user.role, modelId, questionsData);
        return {
            uploaded: result.length,
            message: `Successfully uploaded ${result.length} questions`
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('attempts/:id')
    async findAttempt(@Param('id') id: string, @Request() req: any) {
        const attempt = await this.scorerService.getAttempt(id, req.user.userId);

        // Security Check: Only allow viewing review if attempt is finished? 
        // Logic handled by frontend (only calls this page after finish).
        // Ensure user owns attempt (handled by getAttempt).

        return instanceToPlain(attempt, { groups: ['review'] });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':examId/my-attempts')
    findMyAttempts(@Param('examId') examId: string, @Request() req: any) {
        return this.scorerService.getAttemptsForExam(examId, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('user/stats')
    getStats(@Request() req: any) {
        return this.scorerService.getUserStats(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('user/recent')
    getRecent(@Request() req: any) {
        return this.scorerService.getLatestAttempts(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('performance/leaderboard')
    getLeaderboard() {
        return this.scorerService.getGlobalLeaderboard();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('performance/trend')
    getTrend(@Request() req: any) {
        return this.scorerService.getPerformanceTrend(req.user.userId);
    }

    // --- Hybrid Question Bank Endpoints ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('questions/global')
    getGlobalQuestions() {
        return this.examsService.getGlobalQuestions();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('questions/exam/:examId')
    getExamSpecificQuestions(@Param('examId') examId: string) {
        return this.examsService.getExamSpecificQuestions(examId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('questions/available/:examId')
    getAvailableQuestionsForExam(@Param('examId') examId: string) {
        return this.examsService.getAvailableQuestionsForExam(examId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('chapters/:chapterId/questions')
    getQuestionsByChapter(@Param('chapterId') chapterId: string, @Request() req: any) {
        return this.examsService.getQuestionsByChapter(chapterId, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('questions/stats')
    getQuestionBankStats() {
        return this.examsService.getQuestionBankStats();
    }

    // --- Content Hierarchy Management ---

    @UseGuards(AuthGuard('jwt'))
    // @Roles(UserRole.ADMIN) // Allow students to fetch subjects for practice
    @Get('subjects/all')
    findAllSubjects() {
        return this.examsService.findAllSubjects();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('subjects')
    createSubject(@Body() subjectData: CreateSubjectDto) {
        return this.examsService.createSubject(subjectData);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('subjects/:id/chapters')
    createChapter(@Param('id') subjectId: string, @Body() chapterData: CreateChapterDto) {
        // Ensure subjectId is set in DTO for service
        chapterData.subjectId = subjectId;
        return this.examsService.createChapter(chapterData);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put('subjects/:id')
    updateSubject(@Param('id') id: string, @Body() data: UpdateSubjectDto) {
        return this.examsService.updateSubject(id, data);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete('subjects/:id')
    deleteSubject(@Param('id') id: string) {
        return this.examsService.deleteSubject(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put('subjects/:subjectId/chapters/:chapterId')
    updateChapter(@Param('subjectId') subjectId: string, @Param('chapterId') chapterId: string, @Body() data: UpdateChapterDto) {
        return this.examsService.updateChapter(chapterId, data);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete('subjects/:subjectId/chapters/:chapterId')
    deleteChapter(@Param('subjectId') subjectId: string, @Param('chapterId') chapterId: string) {
        return this.examsService.deleteChapter(chapterId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('chapters/:id/models')
    async createModel(@Param('id') chapterId: string, @Body() modelData: CreateModelDto) {
        return this.examsService.createModel(chapterId, modelData);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put('models/:id')
    updateModel(@Param('id') id: string, @Body() data: any) {
        return this.examsService.updateModel(id, data);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete('models/:id')
    deleteModel(@Param('id') id: string) {
        return this.examsService.deleteModel(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete('chapters/:id')
    deleteChapterDirect(@Param('id') id: string) {
        return this.examsService.deleteChapter(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Put('chapters/:id')
    updateChapterDirect(@Param('id') id: string, @Body() data: any) {
        return this.examsService.updateChapter(id, data);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('questions/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadQuestions(
        @Request() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Body('modelId') modelId?: string,
        @Body('examId') examId?: string
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        if (!modelId && !examId) {
            throw new BadRequestException('Either Model ID or Exam ID is required');
        }

        const parsedQuestions = await this.uploadService.parseExamsFile(file.buffer, file.mimetype);

        // Inject exams into questions if provided
        const questionsWithContext = parsedQuestions.map(q => ({
            ...q,
            exams: examId ? [{ id: examId }] : []
        }));

        return this.examsService.createQuestionsBulk(req.user.userId, req.user.role, modelId, questionsWithContext, examId);
    }

    // --- Question Bank Browser Endpoints ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('question-bank/models')
    async getQuestionBankModels() {
        return this.examsService.getQuestionBankModels();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('question-bank/models/:modelId/questions')
    async getModelQuestions(@Param('modelId') modelId: string) {
        return this.examsService.getModelQuestions(modelId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post(':examId/link-questions')
    async linkQuestionsToExam(
        @Param('examId') examId: string,
        @Body() dto: { questionIds: string[] }
    ) {
        return this.examsService.linkQuestionsToExam(examId, dto.questionIds);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':examId/unlink-questions')
    async unlinkQuestionsFromExam(
        @Param('examId') examId: string,
        @Body() dto: { questionIds: string[] }
    ) {
        return this.examsService.unlinkQuestionsFromExam(examId, dto.questionIds);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('models/:id/questions/bulk')
    createQuestionsBulk(@Request() req: any, @Param('id') modelId: string, @Body() dto: BulkCreateQuestionsDto) {
        return this.examsService.createQuestionsBulk(req.user.userId, req.user.role, modelId, dto.questions);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    deleteExam(@Param('id') id: string) {
        return this.examsService.deleteExam(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('models/:id/export/csv')
    async exportModelCSV(@Param('id') id: string, @Res() res: any) {
        const csv = await this.examsService.exportModelQuestionsToCSV(id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=questions-model-${id}.csv`);
        res.status(200).send(csv);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get(':id/export/csv')
    async exportExamCSV(@Param('id') id: string, @Res() res: any) {
        const csv = await this.examsService.exportExamQuestionsToCSV(id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=questions-exam-${id}.csv`);
        res.status(200).send(csv);
    }

    @UseGuards(AuthGuard('jwt'), PremiumGuard)
    @Get('practice/:chapterId/start')
    async startPractice(@Request() req: any, @Param('chapterId') chapterId: string, @Query('limit') limit: any = 20) {
        const numericLimit = isNaN(parseInt(limit)) ? 20 : parseInt(limit);
        const userId = req.user.userId || req.user.id;
        const questions = await this.examsService.getPracticeQuestions(userId, chapterId, numericLimit);
        return {
            id: `practice-${chapterId}-${Date.now()}`, // Virtual Exam ID
            title: 'Chapter Practice',
            questions
        };
    }
}

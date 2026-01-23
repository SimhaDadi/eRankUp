import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete, Put, UseInterceptors, UploadedFile, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamsService } from './exams.service';
import { ExamsSeederService } from './exams-seeder.service';
import { ScorerService } from './scorer.service';
import { QuestionsUploadService } from './services/questions-upload.service';
import { PaymentsService } from '../payments/payments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestSessionService } from '../test-session/test-session.service';
import { UserRole } from '@erankup/shared';
import { CreateExamDto, UpdateExamDto, CreateSubjectDto, UpdateSubjectDto, CreateChapterDto, UpdateChapterDto, CreateModelDto, BulkCreateQuestionsDto } from '@erankup/shared';

@Controller('exams')
export class ExamsController {
    constructor(
        private readonly examsService: ExamsService,
        private readonly scorerService: ScorerService,
        private readonly paymentsService: PaymentsService,
        @Inject(forwardRef(() => TestSessionService))
        private readonly testSessionService: TestSessionService,
        private readonly seederService: ExamsSeederService,
        private readonly uploadService: QuestionsUploadService,
    ) { }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    async findAll(@Request() req: any) {
        const exams = await this.examsService.findAll();
        const userId = req.user.userId;

        const attemptStats = await this.scorerService.getUserExamStats(userId);
        const activeTestIds = await this.testSessionService.getUserActiveTestIds(userId);

        for (const exam of exams) {
            if (exam.isPremium) {
                (exam as any).hasPurchased = await this.paymentsService.hasPurchased(userId, exam.id);
            }

            // Attach cached attempts and calculate progress
            if (attemptStats[exam.id]) {
                (exam as any).attempts = attemptStats[exam.id];
            }

            // Check if any model in this exam OR the exam itself is currently active
            const examModelIds = exam.models?.map(m => m.id) || [];
            const allRelevantIds = [...examModelIds, exam.id];
            (exam as any).activeSession = activeTestIds.find(id => allRelevantIds.includes(id)) || null;

            // Calculate total models for progress. 
            // If it's a REAL_EXAM but has no models, we treat it as 1 unit of progress if it has questions.
            let totalModels = examModelIds.length;
            if (totalModels === 0 && (exam as any).type === 'real_exam') {
                totalModels = 1;
            }
            (exam as any).totalModels = totalModels;
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
    async getHierarchy() {
        return this.examsService.getFullHierarchy();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        const exam = await this.examsService.findOne(id);
        if (exam && exam.isPremium) {
            (exam as any).hasPurchased = await this.paymentsService.hasPurchased(req.user.userId, exam.id);
        }
        return exam;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('models/:id')
    getModel(@Param('id') id: string, @Request() req: any) {
        return this.examsService.findModel(id, req.user.userId);
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

    @UseGuards(AuthGuard('jwt'))
    @Get('attempts/:id')
    findAttempt(@Param('id') id: string, @Request() req: any) {
        return this.scorerService.getAttempt(id, req.user.userId);
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

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('questions/stats')
    getQuestionBankStats() {
        return this.examsService.getQuestionBankStats();
    }

    // --- Content Hierarchy Management ---

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
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
        return this.examsService.createChapter(subjectId, chapterData);
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
        return this.examsService.updateChapter(subjectId, chapterId, data);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete('subjects/:subjectId/chapters/:chapterId')
    deleteChapter(@Param('subjectId') subjectId: string, @Param('chapterId') chapterId: string) {
        return this.examsService.deleteChapter(subjectId, chapterId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('chapters/:id/models')
    createModel(@Param('id') chapterId: string, @Body() modelData: CreateModelDto) {
        return this.examsService.createModel(chapterId, modelData);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('questions/upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadQuestions(
        @UploadedFile() file: Express.Multer.File,
        @Body('modelId') modelId: string,
        @Body('examId') examId?: string
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        if (!modelId) {
            throw new BadRequestException('Model ID is required');
        }

        const parsedQuestions = await this.uploadService.parseExamsFile(file.buffer, file.mimetype);

        // Inject exams into questions if provided
        const questionsWithContext = parsedQuestions.map(q => ({
            ...q,
            exams: examId ? [{ id: examId }] : []
        }));

        return this.examsService.createQuestionsBulk(modelId, questionsWithContext);
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
    createQuestionsBulk(@Param('id') modelId: string, @Body() dto: BulkCreateQuestionsDto) {
        return this.examsService.createQuestionsBulk(modelId, dto.questions);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    deleteExam(@Param('id') id: string) {
        return this.examsService.deleteExam(id);
    }
}

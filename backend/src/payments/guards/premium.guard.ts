import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PassesService } from '../../passes/passes.service';
import { ExamsService } from '../../exams/exams.service';

@Injectable()
export class PremiumGuard implements CanActivate {
    constructor(
        private passesService: PassesService,
        @Inject(forwardRef(() => ExamsService))
        private examsService: ExamsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId || request.user?.id;
        const testId = request.params.testId || request.body.testId || request.params.chapterId || request.body.chapterId;

        if (!userId) {
            throw new ForbiddenException('User not authenticated');
        }

        if (!testId) return true;

        // [FIX] Skip check for Adaptive Sessions (generated for user)
        if (testId.startsWith('adaptive')) {
            return true;
        }

        // Get the examId from the testId (Model ID)
        const model = await this.examsService.findModel(testId);
        if (!model) return true; // Let the controller handle 404

        // Models can belong to multiple exams, check the first one
        const exam = model.exams?.[0];
        if (!exam || !exam.isPremium) return true;

        // Check if user has active pass with access to this exam
        const hasPassAccess = await this.passesService.canAccessExam(userId, exam.id, exam.type);
        const hasPurchased = await this.examsService['paymentsService'].hasPurchased(userId, exam.id);

        if (!hasPassAccess && !hasPurchased) {
            throw new ForbiddenException(
                'You need an active pass or individual purchase to access this content. Please purchase to continue.'
            );
        }

        return true;
    }
}

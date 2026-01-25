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
        const userId = request.user?.userId;
        const testId = request.params.testId || request.body.testId;

        if (!userId) {
            throw new ForbiddenException('User not authenticated');
        }

        if (!testId) return true;

        // Get the examId from the testId (Model ID)
        const model = await this.examsService.findModel(testId);
        if (!model) return true; // Let the controller handle 404

        // Models can belong to multiple exams, check the first one
        const exam = model.exams?.[0];
        if (!exam || !exam.isPremium) return true;

        // Check if user has active pass with access to this exam
        const hasAccess = await this.passesService.canAccessExam(userId, exam.id, exam.type);

        if (!hasAccess) {
            throw new ForbiddenException(
                'You need an active pass to access this content. Please purchase a pass to continue.'
            );
        }

        return true;
    }
}

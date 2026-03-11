import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PassesService } from '../../passes/passes.service';
import { ExamsService } from '../../exams/exams.service';
import { PaymentsService } from '../payments.service';

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
        if (testId.startsWith('adaptive') || testId.startsWith('chapter-')) {
            return true;
        }

        // Get the examId from the testId (Model ID or Exam ID)
        const model = await this.examsService.findModel(testId);
        if (!model) return true; // Let the controller handle 404

        // Check all associated exams. If any is premium, require a pass.
        const exams = model.exams || [];
        const premiumExam = exams.find(e => e.isPremium);

        if (premiumExam && request.user.role !== 'admin') {
            const hasPassAccess = await this.passesService.canAccessExam(userId, premiumExam.id, premiumExam.type);
            // [DEPRECATED] Individual purchase check removed as per Pass-Only model
            // const hasPurchased = await this.paymentsService.hasPurchased(userId, premiumExam.id);

            if (!hasPassAccess) {
                throw new ForbiddenException(
                    'This is premium content. Please purchase a Test Series Pass to gain unlimited access.'
                );
            }
        }

        return true;
    }
}

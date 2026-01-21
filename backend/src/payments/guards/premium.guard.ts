import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { ExamsService } from '../../exams/exams.service';

@Injectable()
export class PremiumGuard implements CanActivate {
    constructor(
        private paymentsService: PaymentsService,
        private examsService: ExamsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user.userId;
        const testId = request.params.testId || request.body.testId;

        if (!testId) return true;

        // Get the examId from the testId (Model ID)
        const model = await this.examsService.findModel(testId);
        if (!model) return true; // Let the controller handle 404

        // Models can belong to multiple exams, check the first one
        const exam = model.exams?.[0];
        if (!exam || !exam.isPremium) return true;

        const hasPurchased = await this.paymentsService.hasPurchased(userId, exam.id);
        if (!hasPurchased) {
            throw new ForbiddenException('You must purchase this exam to access its contents');
        }

        return true;
    }
}

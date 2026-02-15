import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QualityService } from '../quality/quality.service';

@Controller('questions')
@UseGuards(AuthGuard('jwt'))
export class StudentQuestionsController {
    constructor(private readonly qualityService: QualityService) { }

    @Get('reported')
    async getReportedQuestions(@Request() req: any) {
        return this.qualityService.getUserFlags(req.user.userId);
    }

    @Post(':id/report')
    async reportQuestion(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { reason: string; type?: string }
    ) {
        return this.qualityService.flagQuestion(
            req.user.userId,
            id,
            body.type || 'OTHER',
            body.reason
        );
    }
}

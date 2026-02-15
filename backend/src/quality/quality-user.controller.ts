import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QualityService } from './quality.service';

@Controller('quality')
@UseGuards(AuthGuard('jwt'))
export class QualityUserController {
    constructor(private readonly qualityService: QualityService) { }

    @Get('my-flags')
    async getMyFlags(@Request() req) {
        return this.qualityService.getUserFlags(req.user.userId);
    }

    @Post('flag/:questionId')
    async flagQuestion(
        @Request() req,
        @Param('questionId') questionId: string,
        @Body() body: { type: string; description: string }
    ) {
        return this.qualityService.flagQuestion(
            req.user.userId,
            questionId,
            body.type,
            body.description
        );
    }
}

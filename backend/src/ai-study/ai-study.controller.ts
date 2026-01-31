import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RevisionService } from './revision.service';
// Assuming AuthGuard
import { AuthGuard } from '@nestjs/passport';

@Controller('ai-study')
@UseGuards(AuthGuard('jwt'))
export class AIStudyController {
    constructor(private readonly revisionService: RevisionService) { }

    @Get('revision')
    getRevisionStatus(@Request() req) {
        return this.revisionService.generateRevisionPayload(req.user.id);
    }
}

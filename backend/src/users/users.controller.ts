import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, ClassSerializerInterceptor, SerializeOptions } from '@nestjs/common';
import { UsersService } from './users.service';
import { SavedQuestionsService } from './saved-questions.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt')) // Root guard (Jwt only, add RolesGuard to specific admin routes)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly savedQuestionsService: SavedQuestionsService
    ) { }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    @Patch('profile')
    async updateProfile(@Request() req, @Body() updateData: any) {
        // Security: Whitelist allowed fields to prevent privilege escalation (e.g. updating role)
        const allowedFields = ['fullName', 'phone', 'dob', 'education', 'category', 'location', 'defaultLanguage', 'profilePicture'];
        const filteredData = Object.keys(updateData)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        return this.usersService.updateProfile(req.user.userId, filteredData);
    }

    @Get('profile')
    async getProfile(@Request() req) {
        return this.usersService.findOneById(req.user.userId);
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
        return this.usersService.updateStatus(id, body.isActive);
    }

    // --- Saved Questions ---

    @Post('saved-questions/:questionId/toggle')
    async toggleSave(@Request() req, @Param('questionId') questionId: string) {
        return this.savedQuestionsService.toggleSave(req.user.userId, questionId);
    }

    @Get('saved-questions')
    @SerializeOptions({ groups: ['review'] })
    async getSavedQuestions(@Request() req) {
        return this.savedQuestionsService.getSavedQuestions(req.user.userId);
    }

    @Get('saved-questions/:questionId/status')
    async isSaved(@Request() req, @Param('questionId') questionId: string) {
        const saved = await this.savedQuestionsService.isSaved(req.user.userId, questionId);
        return { saved };
    }
}

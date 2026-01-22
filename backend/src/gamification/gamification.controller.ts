import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GamificationService } from './gamification.service';

@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
    constructor(private readonly gamificationService: GamificationService) { }

    @Get('profile')
    async getProfile(@Request() req: any) {
        return this.gamificationService.getOrCreateProfile(req.user.userId);
    }

    @Get('profile/:userId')
    async getUserProfile(@Param('userId') userId: string) {
        return this.gamificationService.getOrCreateProfile(userId);
    }

    @Post('award-xp')
    async awardXP(@Body() body: { userId: string; amount: number; reason: string }) {
        return this.gamificationService.awardXP(body.userId, body.amount, body.reason);
    }

    @Post('update-streak')
    async updateStreak(@Request() req: any) {
        return this.gamificationService.updateStreak(req.user.userId);
    }

    @Get('leaderboard')
    async getLeaderboard() {
        return this.gamificationService.getLeaderboard(100);
    }

    @Get('daily-challenge')
    async getDailyChallenge() {
        return this.gamificationService.getDailyChallenge();
    }

    @Get('challenge-progress/:challengeId')
    async getChallengeProgress(@Request() req: any, @Param('challengeId') challengeId: string) {
        return this.gamificationService.getUserChallengeProgress(req.user.userId, challengeId);
    }

    @Post('challenge-progress')
    async updateChallengeProgress(
        @Request() req: any,
        @Body() body: { challengeId: string; value: number },
    ) {
        await this.gamificationService.updateChallengeProgress(
            req.user.userId,
            body.challengeId,
            body.value,
        );
        return { success: true };
    }
}

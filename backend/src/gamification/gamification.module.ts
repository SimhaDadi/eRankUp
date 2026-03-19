import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { UserGamification } from './entities/user-gamification.entity';
import { DailyChallenge } from './entities/daily-challenge.entity';
import { UserChallengeProgress } from './entities/user-challenge-progress.entity';

import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserGamification,
            DailyChallenge,
            UserChallengeProgress,
        ]),
        CommonModule,
    ],
    controllers: [GamificationController],
    providers: [GamificationService],
    exports: [GamificationService],
})
export class GamificationModule { }

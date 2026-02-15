import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { SavedQuestion } from './saved-question.entity';
import { Question } from '../exams/entities/question.entity';
import { UsersController } from './users.controller';
import { SavedQuestionsService } from './saved-questions.service';
import { AdminSeeder } from './admin.seeder';

import { UserStats } from './entities/user-stats.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, SavedQuestion, Question, UserStats])],
    controllers: [UsersController],
    providers: [UsersService, SavedQuestionsService, AdminSeeder],
    exports: [UsersService], // Export so AuthModule can use it
})
export class UsersModule { }

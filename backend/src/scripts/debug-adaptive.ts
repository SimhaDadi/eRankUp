import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdaptiveLearningService } from '../adaptive-learning/adaptive-learning.service';
import { UsersService } from '../users/users.service';
import { TestSessionService } from '../test-session/test-session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
    const adaptiveService = app.get(AdaptiveLearningService);
    const usersService = app.get(UsersService);
    const sessionService = app.get(TestSessionService);
    const userRepo = app.get(getRepositoryToken(User));

    console.log('Fetching a user...');
    const user = await userRepo.findOne({ where: {} });
    if (!user) {
        console.log('No user found.');
        await app.close();
        return;
    }
    console.log(`Using User: ${user.email} (${user.id})`);

    console.log('--- Step 1: Generate Learning Path ---');
    const path = await adaptiveService.generateLearningPath(user.id);
    console.log(`Recommended Top Topic: ${path.recommendedTopics[0]?.topic}`);

    // Simulate frontend fetching questions (controller logic)
    // We can't access private controller method, but we can call getQuestionsForTopic
    const topTopic = path.recommendedTopics[0]?.topic || 'General';
    const previewQuestions = await adaptiveService.getQuestionsForTopic(topTopic, 5);
    console.log(`Preview Questions Found: ${previewQuestions.length}`);
    if (previewQuestions.length > 0) {
        console.log(` Sample ID 1: ${previewQuestions[0].id}`);
    } else {
        console.log('❌ No preview questions found!');
    }

    console.log('--- Step 2: Test getQuestionsByIds (Consistency Fix) ---');
    if (previewQuestions.length > 0) {
        const ids = previewQuestions.map(q => q.id);
        console.log(`Fetching IDs: ${ids.join(', ')}`);

        const fetchedQuestions = await adaptiveService.getQuestionsByIds(ids);
        console.log(`Fetched count: ${fetchedQuestions.length}`);

        if (fetchedQuestions.length === ids.length) {
            console.log('✅ Success: Fetched all requested questions by ID.');
        } else {
            console.log(`❌ Failure: Requested ${ids.length}, got ${fetchedQuestions.length}`);
        }
    }

    console.log('--- Step 3: Create Adaptive Session ---');
    // Using fake payload approach
    const session = await sessionService.createAdaptiveSession(user.id, previewQuestions);
    console.log(`Session Created: ${session.testId}`);

    console.log('--- Step 4: Retrieve Session ---');
    const retrieved = await sessionService.getSession(user.id, session.testId);
    if (retrieved) {
        console.log(`Session Retrieved. Status: ${retrieved.status}`);
        console.log(`Questions in Session: ${retrieved.questions?.length}`);
        if (retrieved.questions && retrieved.questions.length > 0) {
            console.log('✅ Success: Session has questions.');
        } else {
            console.log('❌ Failure: Session question list is empty.');
        }
    } else {
        console.log('❌ Failure: Session not found in Redis.');
    }

    await app.close();
}

bootstrap();

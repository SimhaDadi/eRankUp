import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ExplanationService } from '../ai/explanation.service';
import { Question } from '../exams/entities/question.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../users/user.entity';

async function bootstrap() {
    console.log('Bootstrapping diagnostic app context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('App context loaded.');

    try {
        const explanationService = app.get(ExplanationService);
        const questionRepo = app.get(getRepositoryToken(Question));

        console.log('Finding a recent question with a legacy string correctOptionId...');
        const legacyQuestion = await questionRepo.findOne({
            where: [
                { correctOptionId: 'A' }, { correctOptionId: 'a' },
                { correctOptionId: 'B' }, { correctOptionId: 'b' },
                { correctOptionId: '1' }, { correctOptionId: '2' }
            ],
            relations: ['options', 'subject', 'chapter']
        });

        if (!legacyQuestion) {
            console.log('No legacy format questions found in the first 100 records.');
            process.exit(0);
        }

        console.log(`Found legacy question: ${legacyQuestion.id} with correctOptionId: ${legacyQuestion.correctOptionId}`);
        console.log('Triggering generateExplanation pipeline...');

        const result = await explanationService.generateExplanation(
            'diagnostic_user',
            UserRole.ADMIN,
            legacyQuestion.id,
            undefined,
            undefined
        );

        console.log('Pipeline finished!');
        console.log('Result:', result === 'string' ? result : JSON.stringify(result, null, 2));

    } catch (e) {
        console.error('DIAGNOSTIC CAUGHT ERROR:');
        console.error(e);
    } finally {
        await app.close();
        process.exit(0);
    }
}

bootstrap().catch(console.error);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExplanationService } from './ai/explanation.service';
import { UserRole } from './users/user.entity';

async function regenerateQ32() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const explanationService = app.get(ExplanationService);

    const questionId = '379acf93-bec1-4fe3-a35b-c2c5b980d0cb';
    const userId = 'admin-trigger'; // Pseudo ID

    console.log(`[Regen] Triggering fresh explanation for Q.32: ${questionId}`);

    try {
        const result = await explanationService.generateExplanation(
            userId,
            UserRole.ADMIN,
            questionId
        );
        console.log('\n--- NEW CONCISE EXPLANATION ---\n');
        console.log(result);
        console.log('\n-------------------------------\n');
    } catch (error) {
        console.error('[Error] Regeneration failed:', error.message);
    }

    await app.close();
}

regenerateQ32().catch(console.error);

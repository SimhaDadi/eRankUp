import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ExplanationService } from '../ai/explanation.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const explanationService = app.get(ExplanationService);

    console.log('Starting explanation sync...');
    try {
        const result = await explanationService.syncExplanations();
        console.log('Sync complete:', result);
    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        await app.close();
    }
}

bootstrap();

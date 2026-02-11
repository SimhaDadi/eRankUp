import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ExplanationService } from '../ai/explanation.service';

async function bootstrap() {
    console.log('Bootstrapping Nest application context...');
    try {
        const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
        const explanationService = app.get(ExplanationService);

        console.log('Testing listExplanations...');
        const filters = {
            search: '',
            status: 'all' as const,
            limit: 50,
            offset: 0
        };

        const result = await explanationService.listExplanations(filters);
        console.log('Result count:', result.items.length);
        console.log('Total:', result.total);

        await app.close();
    } catch (error) {
        console.error('REPRO FAILED with error:');
        console.error(error);
        process.exit(1);
    }
}

bootstrap();

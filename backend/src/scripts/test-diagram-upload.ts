
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AIService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const aiService = app.get(AIService);

    const imagePath = process.argv[2];
    if (!imagePath) {
        console.error('Usage: ts-node scripts/test-diagram-upload.ts <path-to-image>');
        process.exit(1);
    }

    try {
        console.log(`Reading file: ${imagePath}`);
        const buffer = fs.readFileSync(imagePath);
        const mimetype = 'image/jpeg'; // Assuming jpeg for test

        console.log('Sending to AI for parsing...');
        const results = await aiService.parseDocument({ buffer, mimetype });

        console.log('\n--- AI Results ---');
        console.log(JSON.stringify(results, null, 2));

        const diagrams = results.filter((q: any) => q.hasDiagram);
        console.log(`\nFound ${diagrams.length} questions with diagrams out of ${results.length}.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await app.close();
    }
}

bootstrap();

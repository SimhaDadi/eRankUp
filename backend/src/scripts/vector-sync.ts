import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AIService } from '../ai/ai.service';
import { Question } from '../exams/entities/question.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const aiService = app.get(AIService);
    const questionRepo = app.get<Repository<Question>>(getRepositoryToken(Question));

    console.log('--- Vector Sync Started ---');
    const questions = await questionRepo.find({
        // where: { embedding: null } // Only process questions without embeddings
    });

    console.log(`Found ${questions.length} questions to vectorize.`);

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        try {
            console.log(`[${i + 1}/${questions.length}] Vectorizing: ${q.id}...`);
            // const embedding = await aiService.generateEmbedding(q.content);
            // await questionRepo.update(q.id, { embedding });
            console.log(`[VectorSync] Processed question ${q.id}`);
        } catch (error) {
            console.error(`Failed to vectorize question ${q.id}:`, error.message);
        }
    }

    console.log('--- Vector Sync Completed ---');
    await app.close();
}

bootstrap();

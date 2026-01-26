import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Question } from '../exams/entities/question.entity';
import { Like } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
    const questionRepo = app.get(getRepositoryToken(Question));

    console.log('Searching for "France"...');
    const questions = await questionRepo.find({
        where: { content: Like('%France%') }
    });

    console.log(`Found ${questions.length} questions.`);
    questions.forEach(q => {
        console.log(`ID: ${q.id}`);
        console.log(`Content: ${q.content}`);
        console.log(`Topic: ${q.topic}`);
        console.log(`Explanation: "${q.explanation}"`);
        console.log('-------------------');
    });

    await app.close();
}

bootstrap();

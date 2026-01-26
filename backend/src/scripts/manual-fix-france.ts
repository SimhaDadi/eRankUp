import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Question } from '../exams/entities/question.entity';
import { Like } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
    const questionRepo = app.get(getRepositoryToken(Question));

    console.log('Manually fixing "France" questions...');
    const questions = await questionRepo.find({
        where: { content: Like('%capital of France%') }
    });

    const properExplanation = `**Correct Answer**: Paris is the capital and most populous city of France. It has been the capital since the Middle Ages.

**Explore Other Options**:
- London is the capital of the United Kingdom.
- Berlin is the capital of Germany.
- Madrid is the capital of Spain.

**Key concept**: European Capitals.`;

    for (const q of questions) {
        q.explanation = properExplanation;
        await questionRepo.save(q);
        console.log(`Updated Question ${q.id}`);
    }

    console.log(`Fixed ${questions.length} questions.`);
    await app.close();
}

bootstrap();

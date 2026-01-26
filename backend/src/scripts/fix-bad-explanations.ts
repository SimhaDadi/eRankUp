import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Question } from '../exams/entities/question.entity';
import { AIService } from '../ai/ai.service';
import { Like } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
    const questionRepo = app.get(getRepositoryToken(Question));
    const aiService = app.get(AIService);

    console.log('Searching for questions with poor explanations...');

    // Find all questions where explanation is "Geography." or suspiciously short
    const questions = await questionRepo.find({
        where: [
            { explanation: "Geography." },
            { explanation: "Geography" },
            { explanation: "General" },
            { explanation: Like('Explanation generation failed%') }
        ]
    });

    console.log(`Found ${questions.length} questions to fix.`);

    let fixedCount = 0;
    for (const q of questions) {
        console.log(`Fixing Question ID: ${q.id}`);
        console.log(`Content: ${q.content}`);
        console.log(`Old Explanation: "${q.explanation}"`);

        try {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before starting
            const newExplanation = await aiService.generateQuestionExplanation(q);

            if (newExplanation.includes('Explanation generation failed')) {
                console.log('Skipping due to AI failure response.');
                continue;
            }

            console.log(`New Explanation: "${newExplanation.substring(0, 50)}..."`);

            q.explanation = newExplanation;
            await questionRepo.save(q);
            fixedCount++;
            console.log('✅ Updated.');

        } catch (error) {
            console.error(`❌ Failed to fix question ${q.id}:`, error.message);
            if (error.message.includes('429')) {
                console.log('Waiting 30s due to rate limit...');
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }

    console.log(`Finished. Fixed ${fixedCount} questions.`);
    await app.close();
}

bootstrap();

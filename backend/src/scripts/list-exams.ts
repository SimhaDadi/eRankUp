import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ExamsService } from '../exams/exams.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const examsService = app.get(ExamsService);
    const response = await examsService.findAll({ includeUnpublished: true, page: 1, limit: 100 });
    const exams = response.data;
    console.log('--- List of Exams ---');
    exams.forEach((exam: any, index: number) => {
        console.log(`${index + 1}. [${exam.id}] ${exam.title} - ${exam.isPublished ? 'Published' : 'Draft'}`);
    });
    console.log('---------------------');
    await app.close();
}
bootstrap();

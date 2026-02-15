import { DataSource } from 'typeorm';
import { Question } from './exams/entities/question.entity';
import { Subject } from './exams/entities/subject.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { QuestionExplanation } from './ai/entities/question-explanation.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

async function findQuestion() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'erankup_db',
        entities: [Question, Subject, Chapter, QuestionExplanation],
        synchronize: false,
    });

    await dataSource.initialize();

    // Search for the question content
    const questionRepo = dataSource.getRepository(Question);
    const questions = await questionRepo.createQueryBuilder('q')
        .leftJoinAndSelect('q.chapter', 'chapter')
        .leftJoinAndSelect('q.explanations', 'explanation')
        .where('q.content ILIKE :search', { search: '%A and B together can do a certain amount of work in x days%' })
        .getMany();

    console.log(`Found ${questions.length} questions.`);
    questions.forEach(q => {
        console.log(`\nQUESTION [${q.id}]:`);
        console.log(`Content: ${q.content}`);
        console.log(`Topic: ${q.topic}`);
        console.log(`Chapter: ${q.chapter?.title}`);
        console.log(`Stored Explanation: ${q.explanation}`);
        if (q.explanations && q.explanations.length > 0) {
            console.log('\nAI Explanations:');
            q.explanations.forEach((exp, i) => {
                console.log(`--- Explanation ${i + 1} ---`);
                console.log(`AI: ${exp.aiExplanation}`);
                console.log(`Admin Approved: ${exp.adminApprovedExplanation}`);
            });
        }
    });

    await dataSource.destroy();
}

findQuestion().catch(console.error);

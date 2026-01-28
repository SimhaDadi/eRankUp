import { DataSource } from 'typeorm';
import { Model } from '../exams/entities/model.entity';
import { Question } from '../exams/entities/question.entity';
import { Chapter } from '../exams/entities/chapter.entity';
import { Subject } from '../exams/entities/subject.entity';
import { Exam } from '../exams/entities/exam.entity';
import { User } from '../users/user.entity';
import { Attempt } from '../exams/entities/attempt.entity';
import { Response } from '../exams/entities/response.entity';
import { UserPass } from '../passes/entities/user-pass.entity';
import { Pass } from '../passes/entities/pass.entity';

async function repair() {
    console.log('Initializing Data Source...');
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [Model, Question, Chapter, Subject, Exam, User, Attempt, Response, UserPass, Pass],
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('Parsing Orphaned Questions...');

    const questionRepo = dataSource.getRepository(Question);
    const modelRepo = dataSource.getRepository(Model);

    // 1. Find questions that have a chapterId but match NO entries in model_questions
    // We use a raw query for efficiency to find 'missing' junction rows
    const orphanQuestions = await questionRepo.createQueryBuilder('q')
        .leftJoinAndSelect('q.chapter', 'chapter')
        .leftJoinAndSelect('chapter.models', 'models') // Potential models to link to
        .leftJoin('q.models', 'existingModels')
        .where('existingModels.id IS NULL')
        .andWhere('q.chapterId IS NOT NULL')
        .getMany();

    console.log(`Found ${orphanQuestions.length} potentially orphaned questions (linked to Chapter but not Model).`);

    let fixedCount = 0;

    for (const q of orphanQuestions) {
        if (q.chapter && q.chapter.models && q.chapter.models.length > 0) {
            // Heuristic: If the chapter has only 1 model (common for section-wise tests), link to it.
            // If it has multiple, we might default to the first one or skip if risky.
            // For this repair, we'll link to ALL models in that chapter to be safe (visibility > correctness of separation for now)
            // Or better: Just the first one if it's a "General" type model.

            // Let's link to the first model found in the chapter.
            const targetModel = q.chapter.models[0];

            console.log(`Linking Question ${q.id} -> Model ${targetModel.title} (${targetModel.id})`);

            // We need to use query builder to insert into junction table to avoid fetching usually
            await dataSource.createQueryBuilder()
                .relation(Model, 'questions')
                .of(targetModel)
                .add(q);

            fixedCount++;
        } else {
            console.log(`Skipping Question ${q.id}: No models found in Chapter ${q.chapterId}`);
        }
    }

    console.log(`Successfully repaired ${fixedCount} links.`);

    // Optional: Update totalQuestions counts
    console.log('Syncing Model Question Counts...');
    const counts = await modelRepo.createQueryBuilder('model')
        .leftJoin('model.questions', 'question')
        .select('model.id', 'modelId')
        .addSelect('COUNT(question.id)', 'count')
        .groupBy('model.id')
        .getRawMany();

    for (const row of counts) {
        await modelRepo.update(row.modelId, { totalQuestions: parseInt(row.count) });
    }
    console.log('Counts synced.');

    await dataSource.destroy();
}

repair().catch(console.error);

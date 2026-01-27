import { DataSource } from 'typeorm';
import { Exam } from './exams/entities/exam.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Subject } from './exams/entities/subject.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Purchase } from './exams/entities/purchase.entity';
import { User } from './users/user.entity';

async function checkLive() {
    console.log('--- Checking for Active Live Exams ---');
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase, User],
        synchronize: false,
    });

    await dataSource.initialize();

    const now = new Date();
    console.log(`Current Server Time: ${now.toISOString()}`);

    const exams = await dataSource.getRepository(Exam).createQueryBuilder('exam')
        .where('exam.type = :type', { type: 'live_exam' })
        .getMany();

    console.log(`Found ${exams.length} Total Live Exams.`);

    let activeCount = 0;
    exams.forEach(e => {
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        const isActive = start <= now && end >= now;
        if (isActive) activeCount++;

        console.log(`- [${e.title}]`);
        console.log(`  Start: ${start.toISOString()} | End: ${end.toISOString()} | Active Now? ${isActive}`);
    });

    console.log(`--- Active Live Exams Count: ${activeCount} ---`);
    await dataSource.destroy();
}

checkLive().catch(console.error);

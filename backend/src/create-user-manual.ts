
import { DataSource } from 'typeorm';
import { User, UserRole } from './users/user.entity';
import * as bcrypt from 'bcrypt';
import { Exam } from './exams/entities/exam.entity';
import { Chapter } from './exams/entities/chapter.entity';
import { Subject } from './exams/entities/subject.entity';
import { Model } from './exams/entities/model.entity';
import { Question } from './exams/entities/question.entity';
import { Attempt } from './exams/entities/attempt.entity';
import { Response } from './exams/entities/response.entity';
import { Purchase } from './exams/entities/purchase.entity';

async function createUser() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [User, Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase],
        synchronize: false, // Don't sync, just connect
    });

    try {
        await dataSource.initialize();
        const userRepo = dataSource.getRepository(User);

        const email = 'sivadadi114@gmail.com';
        const rawPassword = 'password123';

        let user = await userRepo.findOne({ where: { email } });
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        if (!user) {
            console.log(`Creating user: ${email}...`);
            user = userRepo.create({
                email,
                password: hashedPassword,
                fullName: 'Siva Dadi',
                role: UserRole.STUDENT,
                isActive: true
            });
            await userRepo.save(user);
            console.log('✅ User created successfully!');
        } else {
            console.log(`Updating existing user: ${email}...`);
            user.password = hashedPassword;
            user.isActive = true;
            await userRepo.save(user);
            console.log('✅ User updated successfully!');
        }

    } catch (err) {
        console.error('❌ Error creating user:', err);
    } finally {
        await dataSource.destroy();
    }
}

createUser();

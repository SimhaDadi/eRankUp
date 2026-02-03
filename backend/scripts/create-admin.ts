import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/user.entity';
import { Exam } from '../src/exams/entities/exam.entity';
import { Chapter } from '../src/exams/entities/chapter.entity';
import { Subject } from '../src/exams/entities/subject.entity';
import { Model } from '../src/exams/entities/model.entity';
import { Question } from '../src/exams/entities/question.entity';
import { Attempt } from '../src/exams/entities/attempt.entity';
import { Response } from '../src/exams/entities/response.entity';
import { Purchase } from '../src/exams/entities/purchase.entity';

// Hardcoded defaults matching local .env
// import * as dotenv from 'dotenv';
// dotenv.config();

async function createAdmin() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'erankup_db',
        entities: [User, Exam, Chapter, Subject, Model, Question, Attempt, Response, Purchase],
        synchronize: true,
    });

    try {
        await dataSource.initialize();
        console.log('Connected to database.');

        const userRepo = dataSource.getRepository(User);
        const adminEmail = 'admin@erankup.com';

        // Check if admin exists
        let adminUser = await userRepo.findOne({ where: { email: adminEmail } });

        // dynamic import bcrypt
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('adminpassword', 10);

        if (!adminUser) {
            console.log('Creating Admin User...');
            adminUser = userRepo.create({
                email: adminEmail,
                password: hashedPassword,
                fullName: 'System Admin',
                role: UserRole.ADMIN,
                isActive: true
            });
            await userRepo.save(adminUser);
            console.log('SUCCESS: Admin user created:');
            console.log('Email: admin@erankup.com');
            console.log('Password: adminpassword');
        } else {
            console.log('Admin user already exists. Updating password...');
            adminUser.password = hashedPassword;
            adminUser.role = UserRole.ADMIN;
            adminUser.isActive = true;
            await userRepo.save(adminUser);
            console.log('SUCCESS: Admin user updated.');
        }

        await dataSource.destroy();
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();

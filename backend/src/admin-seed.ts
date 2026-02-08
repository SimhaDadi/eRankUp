import { createConnection } from 'typeorm';
import { User, UserRole } from './users/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function seedAdmin() {
    // Check if seeding is enabled
    const shouldSeed = process.env.SEED_ADMIN === 'true';

    if (!shouldSeed) {
        console.log('SKIP: Admin seeding disabled (SEED_ADMIN is not true)');
        return;
    }

    const connection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'erankup_db',
        entities: [User],
        synchronize: true,
    });

    const userRepo = connection.getRepository(User);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@erankup.com';
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminPassword123!', 10);

    let admin = await userRepo.findOne({ where: { email: adminEmail } });

    if (!admin) {
        admin = userRepo.create({
            email: adminEmail,
            password: hashedPassword,
            fullName: 'Admin User',
            role: UserRole.ADMIN,
        });
        await userRepo.save(admin);
        console.log('Admin user created successfully.');
    } else {
        // Update existing admin password
        admin.password = hashedPassword;
        admin.role = UserRole.ADMIN;
        await userRepo.save(admin);
        console.log('Admin user password updated successfully.');
    }

    await connection.close();
}

seedAdmin().catch(err => {
    console.error('Error seeding admin user:', err);
    process.exit(1);
});

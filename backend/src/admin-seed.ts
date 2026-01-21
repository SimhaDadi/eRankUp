import { createConnection } from 'typeorm';
import { User, UserRole } from './users/user.entity';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
    const connection = await createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'password',
        database: 'erankup_db',
        entities: [User],
        synchronize: true,
    });

    const userRepo = connection.getRepository(User);
    const adminEmail = 'admin@erankup.com';

    let admin = await userRepo.findOne({ where: { email: adminEmail } });

    if (!admin) {
        const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
        admin = userRepo.create({
            email: adminEmail,
            password: hashedPassword,
            fullName: 'Admin User',
            role: UserRole.ADMIN,
        });
        await userRepo.save(admin);
        console.log('Admin user created successfully.');
    } else {
        console.log('Admin user already exists.');
    }

    await connection.close();
}

seedAdmin().catch(err => {
    console.error('Error seeding admin user:', err);
    process.exit(1);
});

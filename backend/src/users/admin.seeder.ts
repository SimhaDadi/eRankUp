import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async onApplicationBootstrap() {
        const adminEmail = 'admin@erankup.com';
        const adminExists = await this.userRepository.findOne({ where: { email: adminEmail } });

        if (!adminExists) {
            console.log('Seeding Admin User...');
            const hashedPassword = await bcrypt.hash('adminpassword', 10);
            const adminUser = this.userRepository.create({
                email: adminEmail,
                password: hashedPassword,
                fullName: 'System Admin',
                role: UserRole.ADMIN,
                isActive: true,
            });
            await this.userRepository.save(adminUser);
            console.log('Admin User Seeded: admin@erankup.com / adminpassword');
        } else {
            // Ensure role is admin if it exists
            if (adminExists.role !== UserRole.ADMIN) {
                adminExists.role = UserRole.ADMIN;
                await this.userRepository.save(adminExists);
                console.log('Updated existing admin user role.');
            }
        }
    }
}

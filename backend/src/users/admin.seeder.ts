import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) { }

    async onApplicationBootstrap() {
        const seedAdmin = this.configService.get<string | boolean>('SEED_ADMIN');
        const shouldSeed = seedAdmin === true || seedAdmin === 'true';

        if (!shouldSeed) {
            console.log('Admin seeding is disabled (SEED_ADMIN=false). Skipping.');
            return;
        }

        const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@erankup.com');
        const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', 'adminpassword');

        const adminExists = await this.userRepository.findOne({ where: { email: adminEmail } });

        if (!adminExists) {
            console.log(`Seeding Admin User: ${adminEmail}...`);
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const adminUser = this.userRepository.create({
                email: adminEmail,
                password: hashedPassword,
                fullName: 'System Admin',
                role: UserRole.ADMIN,
                isActive: true,
            });
            await this.userRepository.save(adminUser);
            console.log(`Admin User Seeded successfully: ${adminEmail}`);
        } else {
            // Update existing admin password and role
            console.log(`Updating existing Admin User: ${adminEmail}...`);
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            adminExists.password = hashedPassword;
            adminExists.role = UserRole.ADMIN;
            adminExists.isActive = true;
            await this.userRepository.save(adminExists);
            console.log(`Admin User updated successfully: ${adminEmail}`);
        }
    }
}

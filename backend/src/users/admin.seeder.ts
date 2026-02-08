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

        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
        const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

        if (!adminEmail || !adminPassword) {
            console.error('CRITICAL: SEED_ADMIN is true but ADMIN_EMAIL or ADMIN_PASSWORD is not set.');
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminExists = await this.userRepository.findOne({ where: { email: adminEmail } });

        if (!adminExists) {
            console.log(`Seeding Admin User: ${adminEmail}...`);
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
            console.log(`Syncing credentials for existing Admin User: ${adminEmail}`);
            adminExists.password = hashedPassword;
            adminExists.role = UserRole.ADMIN;
            await this.userRepository.save(adminExists);
            console.log('Admin credentials synced successfully.');
        }
    }
}

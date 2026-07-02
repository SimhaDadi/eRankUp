import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findOneByPhone(phone: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { phone } });
    }

    async findOneById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    // Need to explicitly select password for login validation
    async findOneByEmailWithPassword(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'role', 'fullName']
        });
    }

    async create(userData: Partial<User>): Promise<User> {
        const newUser = this.usersRepository.create(userData);
        return this.usersRepository.save(newUser);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({
            select: ['id', 'email', 'fullName', 'role', 'createdAt']
        });
    }

    async updateProfile(id: string, updateData: Partial<User>): Promise<User | null> {
        if (updateData.phone) {
            const existing = await this.findOneByPhone(updateData.phone);
            if (existing && existing.id !== id) {
                throw new ConflictException('This mobile number is already registered');
            }
        }
        await this.usersRepository.update(id, updateData);
        return this.usersRepository.findOne({ where: { id } });
    }

    async updateStatus(id: string, isActive: boolean): Promise<User> {
        await this.usersRepository.update(id, { isActive });
        return this.usersRepository.findOne({ where: { id } });
    }

    async findOneByIdWithRefreshToken(id: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id },
            select: ['id', 'email', 'refreshTokenHash', 'role']
        });
    }
}

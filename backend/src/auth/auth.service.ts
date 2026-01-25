
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginCredentialsDto, SignupDto } from '@erankup/shared';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: SignupDto) {
        const existingUser = await this.usersService.findOneByEmail(registerDto.email);
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });

        // Don't return the password
        const { password: _password, ...result } = user;
        return result;
    }

    async seedAdmin() {
        // ... (keep existing implementation, assuming it doesn't need DTO argument change)
        const email = 'admin@erankup.com';
        const existingUser = await this.usersService.findOneByEmail(email);
        const hashedPassword = await bcrypt.hash('adminpassword', 10);

        if (existingUser) {
            // Update existing admin
            existingUser.password = hashedPassword;
            existingUser.role = 'admin' as any; // Type casting for now if strict
            // We need a save/update method in UsersService, but create can often save if entity has ID
            return this.usersService.create({ ...existingUser, password: hashedPassword, role: 'admin' as any });
        }

        // Create new
        return this.usersService.create({
            email,
            password: hashedPassword,
            fullName: 'System Admin',
            role: 'admin' as any
        });
    }

    async login(loginDto: LoginCredentialsDto) {
        const user = await this.usersService.findOneByEmailWithPassword(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        };
    }

    async validateGoogleUser(googleUser: any) {
        const { email, fullName } = googleUser;
        let user = await this.usersService.findOneByEmail(email);

        if (!user) {
            // Create user without password (OAuth-only users can set password later if needed)
            user = await this.usersService.create({
                email,
                fullName,
                password: '', // Placeholder since they login via Google
            });
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        };
    }
}

import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginCredentialsDto, SignupDto } from '@erankup/shared';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        // Client ID should be in env, but can be passed during verify too
        this.googleClient = new OAuth2Client(
            this.configService.get('GOOGLE_CLIENT_ID')
        );
    }

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

    private readonly logger = new Logger(AuthService.name);

    async login(loginDto: LoginCredentialsDto) {
        this.logger.log(`Attempting login for email: ${loginDto.email}`);
        const user = await this.usersService.findOneByEmailWithPassword(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.password) {
            throw new UnauthorizedException('Please login with your social account');
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

    async verifyMobileGoogleToken(token: string) {
        try {
            const ticket = await this.googleClient.verifyIdToken({ idToken: token });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) throw new UnauthorizedException('Invalid Google Token Payload');

            return this.validateGoogleUser({
                email: payload.email,
                fullName: payload.name || payload.email.split('@')[0],
                picture: payload.picture
            });
        } catch (error) {
            console.error('Google Verify Error:', error);
            throw new UnauthorizedException('Invalid Google Token');
        }
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

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

        if (registerDto.phoneNumber) {
            const existingPhoneUser = await this.usersService.findOneByPhone(registerDto.phoneNumber);
            if (existingPhoneUser) {
                throw new ConflictException('Phone number already in use');
            }
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        
        const { phoneNumber, ...userData } = registerDto;
        const user = await this.usersService.create({
            ...userData,
            phone: phoneNumber, // Map DTO phoneNumber to entity phone
            password: hashedPassword,
            role: 'student' as any // Force student role on public signup
        });

        // Don't return the password
        const { password: _password, ...result } = user;
        return result;
    }

    async seedAdmin() {
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
        const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

        if (!adminEmail || !adminPassword) {
            console.log('SKIP: Admin seeding - ADMIN_EMAIL or ADMIN_PASSWORD not set');
            return null;
        }

        const existingUser = await this.usersService.findOneByEmail(adminEmail);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        if (existingUser) {
            // Update existing admin
            existingUser.password = hashedPassword;
            existingUser.role = 'admin' as any;
            return this.usersService.create({ ...existingUser, password: hashedPassword, role: 'admin' as any });
        }

        // Create new
        return this.usersService.create({
            email: adminEmail,
            password: hashedPassword,
            fullName: 'System Admin',
            role: 'admin' as any
        });
    }

    private readonly logger = new Logger(AuthService.name);

    async login(loginDto: LoginCredentialsDto) {
        this.logger.log(`Attempting login for email: ${loginDto.email}`);
        try {
            const user = await this.usersService.findOneByEmailWithPassword(loginDto.email);

            if (!user) {
                this.logger.warn(`Login failed: User not found for email ${loginDto.email}`);
                throw new UnauthorizedException('Invalid credentials');
            }

            if (!user.password) {
                this.logger.warn(`Login failed: No password set for user ${user.id} (${user.email})`);
                throw new UnauthorizedException('Please login with your social account');
            }

            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(loginDto.password, user.password);
            } catch (error) {
                this.logger.error(`Bcrypt compare failed for email: ${loginDto.email} - ${error.message}`, error.stack);
                // Treat as invalid credentials
                isMatch = false;
            }

            if (!isMatch) {
                this.logger.warn(`Login failed: Password mismatch for user ${user.id}`);
                throw new UnauthorizedException('Invalid credentials');
            }

            this.logger.log(`Password matched for user ${user.id}. Generating tokens...`);
            const tokens = await this.getTokens(user.id, user.email, user.role);

            this.logger.log(`Tokens generated. Updating refresh token hash...`);
            await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

            this.logger.log(`Login successful for user ${user.id}`);
            return {
                ...tokens,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                }
            };
        } catch (error) {
            this.logger.error(`CRITICAL LOGIN ERROR for ${loginDto.email}: ${error.message}`, error.stack);
            throw error; // Re-throw to let it bubble up, but now we have logs
        }
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findOneByIdWithRefreshToken(userId);
        if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Access Denied');

        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

        return tokens;
    }

    async logout(userId: string) {
        await this.usersService.updateProfile(userId, { refreshTokenHash: null });
    }

    async updateRefreshTokenHash(userId: string, refreshToken: string) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateProfile(userId, { refreshTokenHash: hash });
    }

    async getTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '7d', // 7 days access token
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
                expiresIn: '7d', // 7 days refresh token
            }),
        ]);

        return {
            access_token: at,
            refresh_token: rt,
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

        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        };
    }
}

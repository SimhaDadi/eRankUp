import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginCredentialsDto, SignupDto } from '@erankup/shared';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) { }

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('signup')
    async signup(@Body() registerDto: SignupDto) {
        return this.authService.register(registerDto);
    }


    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginCredentialsDto) {
        console.log('Login Request Payload:', JSON.stringify(loginDto, null, 2));
        return this.authService.login(loginDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('google/mobile')
    async googleMobileLogin(@Body('token') token: string) {
        return this.authService.verifyMobileGoogleToken(token);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body('userId') userId: string, @Body('refreshToken') refreshToken: string) {
        return this.authService.refreshTokens(userId, refreshToken);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: any) {
        return this.authService.logout(req.user.userId);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() _req) {
        // Guard will handle redirect to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        const result = await this.authService.validateGoogleUser(req.user);

        // Securely pass token to frontend via redirect
        const domain = this.configService.get<string>('FRONTEND_URL') || 'http://192.168.1.5:3000/auth/callback';
        const data = encodeURIComponent(JSON.stringify(result));

        res.redirect(`${domain}?data=${data}`);
    }
}

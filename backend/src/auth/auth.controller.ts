import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginCredentialsDto, SignupDto } from '@erankup/shared';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) { }

    @Post('signup')
    async signup(@Body() registerDto: SignupDto) {
        return this.authService.register(registerDto);
    }


    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginCredentialsDto) {
        return this.authService.login(loginDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('google/mobile')
    async googleMobileLogin(@Body('token') token: string) {
        return this.authService.verifyMobileGoogleToken(token);
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
        const domain = this.configService.get<string>('FRONTEND_URL') || 'http://192.168.1.4:3000/auth/callback';
        const data = encodeURIComponent(JSON.stringify(result));

        res.redirect(`${domain}?data=${data}`);
    }
}

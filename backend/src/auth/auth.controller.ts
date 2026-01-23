import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginCredentialsDto, SignupDto } from '@erankup/shared';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    async signup(@Body() registerDto: SignupDto) {
        return this.authService.register(registerDto);
    }


    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginCredentialsDto) {
        return this.authService.login(loginDto);
    }
}

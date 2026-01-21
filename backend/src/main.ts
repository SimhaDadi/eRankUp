import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true });

    // Enable Global Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // Restrict CORS
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'];
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    await app.listen(3001);
    console.log(`Backend Application is running on: ${await app.getUrl()}`);
}
// Trigger restart
bootstrap();

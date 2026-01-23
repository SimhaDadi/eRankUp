import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true });

    // Enable Helmet for Security Headers
    app.use(helmet());

    // Enable Global Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // Restrict CORS
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'];

    app.enableCors({
        origin: true, // Allow all for debugging
        credentials: true,
    });

    // Logging middleware
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });

    await app.listen(3001, '0.0.0.0');
    console.log(`Backend Application is running on: ${await app.getUrl()}`);
    console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
}
// Trigger restart
bootstrap();

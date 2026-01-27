import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import helmet from 'helmet';

import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), { rawBody: true });

    // Enable Helmet for Security Headers
    app.use(helmet());

    // Register Global Exception Filter
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

    // Enable Global Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // Restrict CORS
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.3:3000', 'http://192.168.1.3:3001'];

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    await app.listen(3001, '0.0.0.0');
    console.log(`Backend Application is running on: ${await app.getUrl()}`);
    console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
}
// Trigger restart
bootstrap();
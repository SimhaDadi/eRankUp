import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import helmet from 'helmet';

import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter());

    // [FIX] Serve Static Assets (Uploads) directly via Express Adapter
    const path = require('path');
    app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });

    // Increase body parser limits for large image uploads
    const express = require('express');
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    await app.listen(3001, '0.0.0.0');
    console.log(`Backend Application is running on: ${await app.getUrl()}`);
    console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
}
// Trigger restart
bootstrap().catch(err => {
    console.error('Fatal Bootstrap Error:', err);
    process.exit(1);
});
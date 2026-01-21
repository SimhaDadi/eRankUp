import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true });
    // Enable CORS for Frontend
    app.enableCors();
    await app.listen(3001);
    console.log(`Backend Application is running on: ${await app.getUrl()}`);
}
// Trigger restart
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CacheService } from '../common/cache.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const cacheService = app.get(CacheService);
    await cacheService.flush();
    console.log('Redis cache flushed successfully');
    await app.close();
}
bootstrap();

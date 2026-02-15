import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityController } from './quality.controller';
import { QualityUserController } from './quality-user.controller';
import { QualityService } from './quality.service';
import { QualityFlag } from './entities/quality-flag.entity';

@Module({
    imports: [TypeOrmModule.forFeature([QualityFlag])],
    controllers: [QualityController, QualityUserController],
    providers: [QualityService],
    exports: [QualityService]
})
export class QualityModule { }

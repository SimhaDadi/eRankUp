import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doubt } from './entities/doubt.entity';
import { DoubtsService } from './doubts.service';
import { DoubtsController } from './doubts.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Doubt])],
    providers: [DoubtsService],
    controllers: [DoubtsController],
    exports: [DoubtsService],
})
export class DoubtsModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassesService } from './passes.service';
import { PassesController } from './passes.controller';
import { Pass } from './entities/pass.entity';
import { UserPass } from './entities/user-pass.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pass, UserPass])],
  providers: [PassesService],
  controllers: [PassesController],
  exports: [PassesService],
})
export class PassesModule { }

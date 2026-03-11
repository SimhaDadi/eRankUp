import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassesService } from './passes.service';
import { PassesController } from './passes.controller';
import { PassesAdminController } from './passes.admin.controller';
import { Pass } from './entities/pass.entity';
import { UserPass } from './entities/user-pass.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pass, UserPass]),
    forwardRef(() => PaymentsModule),
  ],
  providers: [PassesService],
  controllers: [PassesController, PassesAdminController],
  exports: [PassesService],
})
export class PassesModule { }

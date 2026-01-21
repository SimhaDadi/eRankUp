import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { EmailService } from './email.service';
import { Coupon } from './entities/coupon.entity';
import { EmailCampaign } from './entities/campaign.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Coupon, EmailCampaign, User])
    ],
    controllers: [MarketingController],
    providers: [MarketingService, EmailService],
    exports: [MarketingService, EmailService]
})
export class MarketingModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSessionService } from './test-session.service';
import { TestSessionController } from './test-session.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ExamsModule } from '../exams/exams.module';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { Model } from '../exams/entities/model.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Model]),
        ConfigModule,
        ExamsModule,
        UsersModule,
        PaymentsModule,
        ClientsModule.registerAsync([
            {
                name: 'KAFKA_SERVICE',
                imports: [ConfigModule],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
                        },
                        consumer: {
                            groupId: configService.get<string>('KAFKA_CONSUMER_GROUP', 'erankup-backend-consumer'),
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [TestSessionController],
    providers: [TestSessionService],
    exports: [TestSessionService]
})
export class TestSessionModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSessionService } from './test-session.service';
import { TestSessionController } from './test-session.controller';
import { ConfigModule } from '@nestjs/config';
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
        ClientsModule.register([
            {
                name: 'KAFKA_SERVICE',
                transport: Transport.KAFKA,
                options: {
                    client: {
                        brokers: ['localhost:9092'],
                    },
                    consumer: {
                        groupId: 'erankup-backend-consumer',
                    },
                },
            },
        ]),
    ],
    controllers: [TestSessionController],
    providers: [TestSessionService],
    exports: [TestSessionService]
})
export class TestSessionModule { }

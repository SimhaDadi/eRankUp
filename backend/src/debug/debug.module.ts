import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { AIModule } from '../ai/ai.module';

@Module({
    imports: [
        AIModule
    ],
    controllers: [DebugController],
    providers: []
})
export class DebugModule { }

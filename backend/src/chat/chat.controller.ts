import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getHistory(@Query('limit') limit: number) {
        // Return messages in chronological order for the client (OLD -> NEW)
        const messages = await this.chatService.getHistory(limit || 50);
        return messages.reverse();
    }
}

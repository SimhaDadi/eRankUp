import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AIChatService } from './ai-chat.service';

@Controller('ai-chat')
@UseGuards(AuthGuard('jwt'))
export class AIChatController {
    constructor(private readonly aiChatService: AIChatService) { }

    @Post('message')
    async sendMessage(
        @Request() req: any,
        @Body() body: { conversationId?: string; message: string },
    ) {
        return this.aiChatService.sendMessage(
            req.user.userId,
            body.conversationId || null,
            body.message,
        );
    }

    @Get('conversations')
    async getConversations(@Request() req: any) {
        return this.aiChatService.getConversations(req.user.userId);
    }

    @Get('conversation/:id')
    async getConversation(@Request() req: any, @Param('id') id: string) {
        return this.aiChatService.getConversationMessages(id, req.user.userId);
    }

    @Delete('conversation/:id')
    async deleteConversation(@Request() req: any, @Param('id') id: string) {
        await this.aiChatService.deleteConversation(id, req.user.userId);
        return { success: true };
    }
}

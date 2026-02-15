import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { AIChatService } from './ai-chat.service';
import { UserRole } from '../users/user.entity';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'ai-chat',
})
export class AIChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly aiChatService: AIChatService) { }

    handleConnection(client: Socket) {
        console.log(`[AIChatGateway] Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`[AIChatGateway] Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            userId: string;
            role: string;
            conversationId?: string;
            message: string;
            questionId?: string;
            image?: { data: string; mimeType: string };
        },
    ) {
        console.log(`[AIChatGateway] Received message from ${data.userId}`);

        try {
            // Get the stream from service
            const response = await this.aiChatService.sendMessageStream(
                data.userId,
                data.role as UserRole,
                data.conversationId || null,
                data.message,
                data.questionId,
                data.image
            );

            // Notify initial state
            client.emit('streamStart', { conversationId: response.conversationId });

            let fullText = '';
            for await (const chunk of response.stream) {
                if (!client.connected) {
                    console.log(`[AIChatGateway] Client ${client.id} disconnected during stream. Stopping.`);
                    return;
                }
                fullText += chunk;
                client.emit('streamChunk', { chunk });
            }

            // After stream ends, save and notify final state
            await this.aiChatService.saveAssistantMessage(response.conversationId, fullText, data.userId, data.message);

            const cleanFullText = this.aiChatService.cleanAssistantResponse(fullText);
            client.emit('streamEnd', { fullText: cleanFullText });
        } catch (error) {
            console.error('[AIChatGateway] Error:', error);
            client.emit('error', { message: error.message || 'Stream failed' });
        }
    }
}

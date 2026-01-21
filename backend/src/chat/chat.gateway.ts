import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatService: ChatService) { }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() data: { message: string },
        @ConnectedSocket() client: any,
    ) {
        const user = client.user;

        // Save to DB
        const savedMessage = await this.chatService.saveMessage(user, data.message);

        // Emit to all clients
        this.server.emit('receiveMessage', {
            id: savedMessage.id,
            user: user.name, // or user.fullName
            userId: user.userId, // or user.id
            message: savedMessage.content,
            timestamp: savedMessage.createdAt.toISOString(),
        });
    }

    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        // Optional: specific logic to identify user via query param or header if needed for history
        // For public chat, we can just emit recent history
        const history = await this.chatService.getHistory(50);

        // Transform for client
        const formattedHistory = history.map(msg => ({
            id: msg.id,
            user: msg.sender?.fullName || msg.sender?.email || 'Unknown',
            userId: msg.sender?.id,
            message: msg.content,
            timestamp: msg.createdAt.toISOString()
        })).reverse(); // Oldest first for chat UI

        client.emit('previousMessages', formattedHistory);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }
}

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
import { UsersService } from '../users/users.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly usersService: UsersService,
    ) { }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() data: { message: string },
        @ConnectedSocket() client: any,
    ) {
        const user = client.user; // Decoded JWT: { sub, email, role }
        const userMessage = data.message.toLowerCase();

        // Save visitor message to DB
        const savedMessage = await this.chatService.saveMessage(user.sub, data.message);

        // Emit user's message to all clients (for real-time update)
        this.server.emit('receiveMessage', {
            id: savedMessage.id,
            user: user.email,
            userId: user.sub,
            message: savedMessage.content,
            timestamp: savedMessage.createdAt.toISOString(),
        });

        // --- Auto-Reply Logic ---
        let autoReplyText = '';

        if (userMessage.includes('hi') || userMessage.includes('hello') || userMessage.includes('hey')) {
            autoReplyText = "Hello! Welcome to eRankUp Support. How can we assist you with your exam preparation today?";
        } else if (userMessage.includes('price') || userMessage.includes('plan') || userMessage.includes('cost')) {
            autoReplyText = "We have 3 great plans to help you succeed: \n" +
                "1. Starter Trial (₹0) - 30 days access\n" +
                "2. Quarterly Sprint (₹499) - 90 days access\n" +
                "3. Annual Elite (₹1499) - 1 Year Best Value!\n" +
                "Check them out at /dashboard/plans";
        } else if (userMessage.includes('error') || userMessage.includes('help') || userMessage.includes('issue')) {
            autoReplyText = "We're here to help! Please describe the issue in detail, and our team will get back to you shortly.";
        } else {
            autoReplyText = "Our team will resolve the issue at the earliest....Thank you";
        }

        if (autoReplyText) {
            // Find system admin user for the reply
            const admin = await this.usersService.findOneByEmail('admin@erankup.com');
            const supportUserId = admin?.id || user.sub; // Fallback if admin not found (shouldn't happen)
            const supportName = "eRankUp Support";

            // Delayed reply for realism
            setTimeout(async () => {
                const autoSaved = await this.chatService.saveMessage(supportUserId, autoReplyText);
                this.server.emit('receiveMessage', {
                    id: autoSaved.id,
                    user: supportName,
                    userId: supportUserId,
                    message: autoSaved.content,
                    timestamp: autoSaved.createdAt.toISOString(),
                });
            }, 1000);
        }
    }

    async handleConnection(client: Socket) {
        const token = client.handshake.query.token;
        console.log(`[ChatGateway] Client attempting to connect: ${client.id}, Token present: ${!!token}`);

        // Manual check if guard isn't applied to handleConnection
        // Most history fetching happens here
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
        console.log(`[ChatGateway] Client disconnected: ${client.id}`);
    }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/message.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatMessage)
        private messageRepository: Repository<ChatMessage>,
    ) { }

    async saveMessage(userId: string, content: string): Promise<ChatMessage> {
        const message = this.messageRepository.create({
            senderId: userId,
            content,
        });
        return this.messageRepository.save(message);
    }

    async getHistory(limit: number = 50): Promise<ChatMessage[]> {
        return this.messageRepository.find({
            relations: ['sender'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
}

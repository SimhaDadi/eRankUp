import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';

@Entity('ai_chat_message')
export class AIChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    conversationId: string;

    @ManyToOne(() => ChatConversation, conversation => conversation.messages)
    @JoinColumn({ name: 'conversationId' })
    conversation: ChatConversation;

    @Column({ type: 'varchar', length: 20 })
    role: string; // 'user' or 'assistant'

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'jsonb', nullable: true })
    context: any; // {weakAreas, currentTopic, masteryScores}

    @Column({ type: 'jsonb', nullable: true })
    image: { data: string; mimeType: string };

    @CreateDateColumn()
    createdAt: Date;
}

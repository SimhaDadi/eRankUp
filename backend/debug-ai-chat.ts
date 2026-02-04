import { AppDataSource } from './src/data-source';
import { AIChatService } from './src/ai-chat/ai-chat.service';
import { UserRole } from './src/users/user.entity';

async function debugMessage() {
    try {
        await AppDataSource.initialize();
        console.log('DB Initialized');

        // Get first user
        const user = await AppDataSource.query('SELECT id FROM "user" LIMIT 1');
        if (!user.length) {
            console.error('No users found in database');
            return;
        }
        const userId = user[0].id;
        console.log('Using User ID:', userId);

        // Get AIChatService from elsewhere or instantiate manually
        // Since it has many dependencies, it's easier to use a partial mock or just test the DB parts
        const repoConversation = AppDataSource.getRepository('ChatConversation');
        const repoMessage = AppDataSource.getRepository('AIChatMessage');
        const repoUser = AppDataSource.getRepository('User');
        const repoQuestion = AppDataSource.getRepository('Question');
        const repoResponse = AppDataSource.getRepository('Response');
        const repoMastery = AppDataSource.getRepository('UserTopicMastery');
        const repoInsight = AppDataSource.getRepository('StudentInsight');

        console.log('Testing DB operations for AI Chat...');

        // Try creating a conversation
        const title = 'Test Conversation';
        const conversation = await repoConversation.save(
            repoConversation.create({ userId, title })
        );
        console.log('Conversation created:', conversation.id);

        // Try creating a message
        const message = await repoMessage.save(
            repoMessage.create({
                conversationId: conversation.id,
                role: 'user',
                content: 'Hello',
                context: { timestamp: new Date().toISOString() }
            })
        );
        console.log('Message created:', message.id);

        console.log('✅ DB operations for AI Chat are WORKING.');

    } catch (err) {
        console.error('❌ DB Operation Failed:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

debugMessage();

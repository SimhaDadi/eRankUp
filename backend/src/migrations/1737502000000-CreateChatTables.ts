import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateChatTables1737502000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create chat_conversation table
        await queryRunner.createTable(
            new Table({
                name: 'chat_conversation',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        const chatConversationTable = await queryRunner.getTable('chat_conversation');
        if (chatConversationTable) {
            const existingFk = chatConversationTable.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
            if (!existingFk) {
                await queryRunner.createForeignKey(
                    'chat_conversation',
                    new TableForeignKey({
                        columnNames: ['userId'],
                        referencedTableName: 'user',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    }),
                );
            }

            const existingIndex = chatConversationTable.indices.find(idx => idx.columnNames.indexOf('userId') !== -1);
            if (!existingIndex) {
                await queryRunner.createIndex(
                    'chat_conversation',
                    new TableIndex({
                        name: 'IDX_CHAT_USER',
                        columnNames: ['userId'],
                    }),
                );
            }
        }

        // Create chat_message table
        await queryRunner.createTable(
            new Table({
                name: 'chat_message',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'conversationId',
                        type: 'uuid',
                    },
                    {
                        name: 'role',
                        type: 'varchar',
                        length: '20',
                    },
                    {
                        name: 'content',
                        type: 'text',
                    },
                    {
                        name: 'context',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        const chatMessageTable = await queryRunner.getTable('chat_message');
        if (chatMessageTable) {
            const existingMessageFk = chatMessageTable.foreignKeys.find(fk => fk.columnNames.indexOf('conversationId') !== -1);
            if (!existingMessageFk) {
                await queryRunner.createForeignKey(
                    'chat_message',
                    new TableForeignKey({
                        columnNames: ['conversationId'],
                        referencedTableName: 'chat_conversation',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    }),
                );
            }

            const existingMessageIndex = chatMessageTable.indices.find(idx => idx.columnNames.indexOf('conversationId') !== -1);
            if (!existingMessageIndex) {
                await queryRunner.createIndex(
                    'chat_message',
                    new TableIndex({
                        name: 'IDX_MESSAGE_CONVERSATION',
                        columnNames: ['conversationId'],
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('chat_message');
        await queryRunner.dropTable('chat_conversation');
    }
}

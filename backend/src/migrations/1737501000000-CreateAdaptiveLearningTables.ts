import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAdaptiveLearningTables1737501000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_topic_mastery table
        await queryRunner.createTable(
            new Table({
                name: 'user_topic_mastery',
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
                        name: 'topic',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'subjectId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'masteryScore',
                        type: 'float',
                        default: 0,
                    },
                    {
                        name: 'totalAttempts',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'correctAttempts',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'lastPracticedAt',
                        type: 'timestamp',
                        isNullable: true,
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
                foreignKeys: [
                    {
                        columnNames: ['userId'],
                        referencedTableName: 'user',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['subjectId'],
                        referencedTableName: 'subject',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createIndex(
            'user_topic_mastery',
            new TableIndex({
                name: 'IDX_USER_TOPIC_MASTERY_UNIQUE',
                columnNames: ['userId', 'topic', 'subjectId'],
                isUnique: true,
            }),
        );

        await queryRunner.createIndex(
            'user_topic_mastery',
            new TableIndex({
                name: 'IDX_USER_TOPIC_MASTERY_SCORE',
                columnNames: ['userId', 'masteryScore'],
            }),
        );

        // Create learning_path table
        await queryRunner.createTable(
            new Table({
                name: 'learning_path',
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
                        name: 'recommendedTopics',
                        type: 'jsonb',
                        default: "'[]'",
                    },
                    {
                        name: 'weakAreas',
                        type: 'jsonb',
                        default: "'[]'",
                    },
                    {
                        name: 'strongAreas',
                        type: 'jsonb',
                        default: "'[]'",
                    },
                    {
                        name: 'generatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'expiresAt',
                        type: 'timestamp',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['userId'],
                        referencedTableName: 'user',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('learning_path');
        await queryRunner.dropTable('user_topic_mastery');
    }
}

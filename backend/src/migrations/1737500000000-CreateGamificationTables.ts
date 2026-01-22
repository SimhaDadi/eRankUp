import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGamificationTables1737500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_gamification table
        await queryRunner.createTable(
            new Table({
                name: 'user_gamification',
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
                        isUnique: true,
                    },
                    {
                        name: 'totalXp',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'level',
                        type: 'int',
                        default: 1,
                    },
                    {
                        name: 'currentStreak',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'longestStreak',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'lastActivityDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'badges',
                        type: 'jsonb',
                        default: "'[]'",
                    },
                    {
                        name: 'testsCompleted',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'correctAnswers',
                        type: 'int',
                        default: 0,
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
                ],
            }),
            true,
        );

        // Create index on totalXp for leaderboard queries
        await queryRunner.createIndex(
            'user_gamification',
            new TableIndex({
                name: 'IDX_USER_GAMIFICATION_XP',
                columnNames: ['totalXp'],
            }),
        );

        // Create daily_challenge table
        await queryRunner.createTable(
            new Table({
                name: 'daily_challenge',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'date',
                        type: 'date',
                        isUnique: true,
                    },
                    {
                        name: 'challengeType',
                        type: 'varchar',
                        length: '50',
                    },
                    {
                        name: 'targetValue',
                        type: 'int',
                    },
                    {
                        name: 'rewardXp',
                        type: 'int',
                    },
                    {
                        name: 'description',
                        type: 'text',
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

        // Create user_challenge_progress table
        await queryRunner.createTable(
            new Table({
                name: 'user_challenge_progress',
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
                        name: 'challengeId',
                        type: 'uuid',
                    },
                    {
                        name: 'currentValue',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'completed',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'completedAt',
                        type: 'timestamp',
                        isNullable: true,
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
                        columnNames: ['challengeId'],
                        referencedTableName: 'daily_challenge',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );

        // Create unique constraint on user_challenge_progress
        await queryRunner.createIndex(
            'user_challenge_progress',
            new TableIndex({
                name: 'IDX_USER_CHALLENGE_UNIQUE',
                columnNames: ['userId', 'challengeId'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('user_challenge_progress');
        await queryRunner.dropTable('daily_challenge');
        await queryRunner.dropTable('user_gamification');
    }
}

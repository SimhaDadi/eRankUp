import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateQuestionExplanation1737555000000 implements MigrationInterface {
    name = 'CreateQuestionExplanation1737555000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create question_explanation table safely
        await queryRunner.createTable(
            new Table({
                name: 'question_explanation',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'questionId',
                        type: 'uuid',
                    },
                    {
                        name: 'aiExplanation',
                        type: 'text',
                    },
                    {
                        name: 'adminApprovedExplanation',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'isVerified',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'helpfulCount',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'notHelpfulCount',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'averageRating',
                        type: 'double precision',
                        default: 0,
                    },
                    {
                        name: 'viewCount',
                        type: 'integer',
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
            }),
            true, // ifNotExists
        );

        const table = await queryRunner.getTable('question_explanation');
        if (table) {
            // Safe Index Creation
            const existingIndex = table.indices.find(idx => idx.columnNames.indexOf('questionId') !== -1);
            if (!existingIndex) {
                await queryRunner.createIndex(
                    'question_explanation',
                    new TableIndex({
                        name: `IDX_question_explanation_questionId`,
                        columnNames: ['questionId'],
                    }),
                );
            }

            // Safe Foreign Key Creation
            const existingFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('questionId') !== -1);
            if (!existingFk) {
                await queryRunner.createForeignKey(
                    'question_explanation',
                    new TableForeignKey({
                        name: 'FK_question_explanation_question', // Explicit name to help tracking
                        columnNames: ['questionId'],
                        referencedTableName: 'question',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                        onUpdate: 'NO ACTION'
                    })
                );
            }
        }

        // Migrate existing explanations safely (avoid duplicates)
        await queryRunner.query(`
            INSERT INTO "question_explanation" ("questionId", "aiExplanation", "isVerified", "createdAt", "updatedAt")
            SELECT 
                q."id",
                q."explanation",
                true,
                now(),
                now()
            FROM "question" q
            WHERE q."explanation" IS NOT NULL 
            AND q."explanation" != ''
            AND NOT EXISTS (
                SELECT 1 FROM "question_explanation" qe WHERE qe."questionId" = q."id"
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Copy data back to question.explanation before dropping table
        await queryRunner.query(`
            UPDATE "question" q
            SET "explanation" = qe."aiExplanation"
            FROM "question_explanation" qe
            WHERE q."id" = qe."questionId"
            AND qe."isVerified" = true
        `);

        const table = await queryRunner.getTable('question_explanation');
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('questionId') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('question_explanation', foreignKey);
            }

            const index = table.indices.find(idx => idx.columnNames.indexOf('questionId') !== -1);
            if (index) {
                await queryRunner.dropIndex('question_explanation', index);
            }
        }

        await queryRunner.dropTable('question_explanation', true);
    }
}

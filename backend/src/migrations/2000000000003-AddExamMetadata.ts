import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExamMetadata2000000000003 implements MigrationInterface {
    name = 'AddExamMetadata2000000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists first to avoid errors if run multiple times
        const hasColumn = await queryRunner.hasColumn("exam", "metadata");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "exam" ADD "metadata" jsonb`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "metadata"`);
    }
}

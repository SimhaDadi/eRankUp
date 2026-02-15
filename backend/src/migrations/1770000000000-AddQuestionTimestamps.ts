import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionTimestamps1770000000000 implements MigrationInterface {
    name = 'AddQuestionTimestamps1770000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add createdAt and updatedAt columns to question table
        await queryRunner.query(`ALTER TABLE "question" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "question" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN IF EXISTS "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN IF EXISTS "createdAt"`);
    }
}

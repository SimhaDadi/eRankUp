import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExplanationLogicalCheckColumns2000000000004 implements MigrationInterface {
    name = 'AddExplanationLogicalCheckColumns2000000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isLogicalMismatch column if it doesn't exist
        await queryRunner.query(`ALTER TABLE "question_explanation" ADD COLUMN IF NOT EXISTS "isLogicalMismatch" boolean NOT NULL DEFAULT false`);
        // Add logicalSolveOutcome column if it doesn't exist
        await queryRunner.query(`ALTER TABLE "question_explanation" ADD COLUMN IF NOT EXISTS "logicalSolveOutcome" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_explanation" DROP COLUMN IF EXISTS "logicalSolveOutcome"`);
        await queryRunner.query(`ALTER TABLE "question_explanation" DROP COLUMN IF EXISTS "isLogicalMismatch"`);
    }
}

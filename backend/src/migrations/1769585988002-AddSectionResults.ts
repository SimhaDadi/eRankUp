import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSectionResults1769585988002 implements MigrationInterface {
    name = 'AddSectionResults1769585988002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add sectionResults JSONB column to attempt table
        await queryRunner.query(`ALTER TABLE "attempt" ADD COLUMN IF NOT EXISTS "sectionResults" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt" DROP COLUMN IF EXISTS "sectionResults"`);
    }
}

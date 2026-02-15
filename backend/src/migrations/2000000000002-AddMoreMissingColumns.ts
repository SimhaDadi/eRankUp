import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoreMissingColumns2000000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add videoSolutionUrl to exam table
        await queryRunner.query(`
            ALTER TABLE "exam" ADD COLUMN IF NOT EXISTS "videoSolutionUrl" character varying
        `);

        // Add paymentMethod to user_pass table
        await queryRunner.query(`
            ALTER TABLE "user_pass" ADD COLUMN IF NOT EXISTS "paymentMethod" character varying
        `);

        // Add paymentMethod to purchase table
        await queryRunner.query(`
            ALTER TABLE "purchase" ADD COLUMN IF NOT EXISTS "paymentMethod" character varying
        `);

        // Add image column to ai_chat_message table
        await queryRunner.query(`
            ALTER TABLE "ai_chat_message" ADD COLUMN IF NOT EXISTS "image" jsonb
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_chat_message" DROP COLUMN IF EXISTS "image"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP COLUMN IF EXISTS "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "user_pass" DROP COLUMN IF EXISTS "paymentMethod"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN IF EXISTS "videoSolutionUrl"`);
    }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserMissingColumns2000000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add preferredPaymentMethod column to user table if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "preferredPaymentMethod" character varying
        `);

        // Add refreshTokenHash column to user table if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "refreshTokenHash" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "refreshTokenHash"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "preferredPaymentMethod"`);
    }
}

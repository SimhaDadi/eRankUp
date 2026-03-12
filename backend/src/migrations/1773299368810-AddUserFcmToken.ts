import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserFcmToken1773299368810 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add fcmToken column to user table if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "fcmToken" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "fcmToken"`);
    }
}

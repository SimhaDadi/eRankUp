import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneUniqueConstraint1782965964568 implements MigrationInterface {
    name = 'AddPhoneUniqueConstraint1782965964568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the unique constraint to user.phone
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_user_phone" UNIQUE ("phone")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the unique constraint
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_user_phone"`);
    }
}

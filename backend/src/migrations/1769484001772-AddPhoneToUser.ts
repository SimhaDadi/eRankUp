import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneToUser1769484001772 implements MigrationInterface {
    name = 'AddPhoneToUser1769484001772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "phone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
    }

}

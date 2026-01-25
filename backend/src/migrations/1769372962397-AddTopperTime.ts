import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTopperTime1769372962397 implements MigrationInterface {
    name = 'AddTopperTime1769372962397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" ADD "avgTopperTime" double precision NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "avgTopperTime"`);
    }

}

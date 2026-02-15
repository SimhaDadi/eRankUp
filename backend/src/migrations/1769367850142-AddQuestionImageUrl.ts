import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionImageUrl1769367850142 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" ADD "imageUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "imageUrl"`);
    }

}

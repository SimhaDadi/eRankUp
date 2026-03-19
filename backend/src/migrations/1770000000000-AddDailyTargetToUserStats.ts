import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDailyTargetToUserStats1770000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_stats" ADD "dailyQuestionTarget" integer NOT NULL DEFAULT '100'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_stats" DROP COLUMN "dailyQuestionTarget"`);
    }
}

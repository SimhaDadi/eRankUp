import { MigrationInterface, QueryRunner } from "typeorm";

export class ManualAddDailyGoalTarget1769944200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_gamification" ADD "dailyQuestionTarget" integer NOT NULL DEFAULT '100'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_gamification" DROP COLUMN "dailyQuestionTarget"`);
    }
}

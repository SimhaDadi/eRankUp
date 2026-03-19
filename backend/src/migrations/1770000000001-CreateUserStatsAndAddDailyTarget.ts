import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserStatsAndAddDailyTarget1770000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_stats table if it doesn't exist
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_stats" (
                "userId" uuid NOT NULL,
                "totalAttempts" integer NOT NULL DEFAULT '0',
                "totalScore" double precision NOT NULL DEFAULT '0',
                "totalQuestionsAttempted" integer NOT NULL DEFAULT '0',
                "totalCorrect" integer NOT NULL DEFAULT '0',
                "totalTimeTaken" integer NOT NULL DEFAULT '0',
                "currentStreak" integer NOT NULL DEFAULT '0',
                "lastAttemptDate" TIMESTAMP,
                "topicPerformance" jsonb NOT NULL DEFAULT '{}',
                "dailyQuestionTarget" integer NOT NULL DEFAULT '100',
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_stats_userId" PRIMARY KEY ("userId"),
                CONSTRAINT "FK_user_stats_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // If table existed but column was missing (unlikely but safe)
        const hasColumn = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_stats' AND column_name = 'dailyQuestionTarget'
        `);

        if (hasColumn.length === 0) {
            await queryRunner.query(`ALTER TABLE "user_stats" ADD "dailyQuestionTarget" integer NOT NULL DEFAULT '100'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "user_stats"`);
    }
}

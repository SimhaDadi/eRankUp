import { MigrationInterface, QueryRunner } from "typeorm";

export class AutomaticRecalculateStats1770000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Basic aggregation for user_stats
        await queryRunner.query(`
            INSERT INTO "user_stats" ("userId", "totalAttempts", "totalScore", "totalQuestionsAttempted", "totalCorrect", "totalTimeTaken", "currentStreak", "lastAttemptDate", "topicPerformance", "dailyQuestionTarget", "updatedAt")
            SELECT 
                "userId", 
                COUNT(*) as totalAttempts,
                SUM("score") as totalScore,
                SUM("totalQuestions") as totalQuestionsAttempted,
                SUM("correctAnswers") as totalCorrect,
                SUM("timeTaken") as totalTimeTaken,
                1 as currentStreak,
                MAX("createdAt") as lastAttemptDate,
                '{}'::jsonb as topicPerformance,
                100 as dailyQuestionTarget,
                NOW() as updatedAt
            FROM "attempt"
            WHERE "userId" IS NOT NULL
            GROUP BY "userId"
            ON CONFLICT ("userId") DO UPDATE SET
                "totalAttempts" = EXCLUDED."totalAttempts",
                "totalScore" = EXCLUDED."totalScore",
                "totalQuestionsAttempted" = EXCLUDED."totalQuestionsAttempted",
                "totalCorrect" = EXCLUDED."totalCorrect",
                "totalTimeTaken" = EXCLUDED."totalTimeTaken",
                "lastAttemptDate" = EXCLUDED."lastAttemptDate"
        `);

        // 2. Complex aggregation for topicPerformance
        // This updates the topicPerformance JSONB by joining attempts, responses and questions
        await queryRunner.query(`
            UPDATE "user_stats" s
            SET "topicPerformance" = subquery.perf
            FROM (
                SELECT t."userId", 
                       jsonb_object_agg(
                           COALESCE(t.topic, 'General'), 
                           json_build_object(
                               'correct', t.correct_count, 
                               'total', t.total_count
                           )
                       ) as perf
                FROM (
                    SELECT a."userId", q.topic, 
                           COUNT(*) as total_count,
                           SUM(CASE WHEN r."isCorrect" THEN 1 ELSE 0 END) as correct_count
                    FROM "response" r
                    JOIN "question" q ON r."questionId" = q.id
                    JOIN "attempt" a ON r."attemptId" = a.id
                    WHERE a."userId" IS NOT NULL
                    GROUP BY a."userId", q.topic
                ) t
                GROUP BY t."userId"
            ) as subquery
            WHERE s."userId" = subquery."userId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need to undo data recalculation usually, but we could clear stats
        // await queryRunner.query(`UPDATE "user_stats" SET "totalAttempts" = 0, "totalScore" = 0`);
    }
}

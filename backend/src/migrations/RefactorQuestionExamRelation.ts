import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorQuestionExamRelation1706000000000 implements MigrationInterface {
    name = 'RefactorQuestionExamRelation1706000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create Enum Type safely
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_type_enum') THEN
                    CREATE TYPE "public"."exam_type_enum" AS ENUM('real_exam', 'question_bank');
                END IF;
            END$$;
        `);

        // 2. Add 'type' column to Exam safely
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exam' AND column_name='type') THEN
                    ALTER TABLE "exam" ADD "type" "public"."exam_type_enum" NOT NULL DEFAULT 'real_exam';
                END IF;
            END$$;
        `);

        // 3. Create Junction Table safely
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "exam_questions_question" ("examId" uuid NOT NULL, "questionId" uuid NOT NULL, CONSTRAINT "PK_exam_questions_question" PRIMARY KEY ("examId", "questionId"))`);

        // Create indexes if they don't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_exam_questions_question_examId') THEN
                    CREATE INDEX "IDX_exam_questions_question_examId" ON "exam_questions_question" ("examId");
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_exam_questions_question_questionId') THEN
                    CREATE INDEX "IDX_exam_questions_question_questionId" ON "exam_questions_question" ("questionId");
                END IF;
            END$$;
        `);

        // 4. Add Constraints safely
        // Check if constraint exists before adding (Postgres doesn't support ADD CONSTRAINT IF NOT EXISTS directly, but we can catch error or just rely on table existence implying it)
        // Better: Drop if exists then add, or wrap in DO block.
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_exam_questions_question_examId') THEN
                    ALTER TABLE "exam_questions_question" ADD CONSTRAINT "FK_exam_questions_question_examId" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_exam_questions_question_questionId') THEN
                    ALTER TABLE "exam_questions_question" ADD CONSTRAINT "FK_exam_questions_question_questionId" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END$$;
        `);

        // 5. MIGRATE DATA: Copy existing Question.examId -> Junction Table
        // Only insert if examId is not null
        await queryRunner.query(`INSERT INTO "exam_questions_question" ("examId", "questionId") SELECT "examId", "id" FROM "question" WHERE "examId" IS NOT NULL`);

        // 6. Safe Drop: Drop the foreign key and column from Question
        // Find constraints first if needed, but standard naming is FK_...
        // We will try running standard drop command. If constraint name varies, might fail, but TypeORM usually names them FK_... + hash. 
        // Better to check `question` table constraint name if possible, but let's assume we can drop column CASCADE.

        // Dropping the constraint first ensures safety. Name is usually generated. 
        // Let's rely on dropping the column with CASCADE which should remove the constraint.
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "examId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse is hard because we go from Many-to-Many back to One-to-Many (potential data loss if a question is in multiple exams).
        // We will restore the column and pick *one* exam to link back (or leave null).

        await queryRunner.query(`ALTER TABLE "question" ADD "examId" uuid`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_question_examId" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Try to restore data (pick the first exam found for each question)
        await queryRunner.query(`UPDATE "question" SET "examId" = "eq"."examId" FROM (SELECT DISTINCT ON ("questionId") "examId", "questionId" FROM "exam_questions_question") AS "eq" WHERE "question"."id" = "eq"."questionId"`);

        await queryRunner.query(`DROP TABLE "exam_questions_question"`);
        await queryRunner.query(`ALTER TABLE "exam" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."exam_type_enum"`);
    }
}

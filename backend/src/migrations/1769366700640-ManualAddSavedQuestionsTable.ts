import { MigrationInterface, QueryRunner } from "typeorm";

export class ManualAddSavedQuestionsTable1769366700640 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "saved_question" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "questionId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_saved_question_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_saved_question_user_question" UNIQUE ("userId", "questionId"),
                CONSTRAINT "FK_saved_question_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_saved_question_question" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "saved_question"`);
    }

}

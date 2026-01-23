import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769180602262 implements MigrationInterface {
    name = 'Init1769180602262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'student', 'teacher')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "fullName" character varying, "role" "public"."user_role_enum" NOT NULL DEFAULT 'student', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "dob" TIMESTAMP, "education" character varying, "category" character varying, "location" character varying, "defaultLanguage" character varying, "profilePicture" character varying, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6620cd026ee2b231beac7cfe57" ON "user" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_e11e649824a45d8ed01d597fd9" ON "user" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE "subject" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "icon" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "examId" uuid, CONSTRAINT "PK_12eee115462e38d62e5455fc054" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chapter" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "subjectId" uuid, CONSTRAINT "PK_275bd1c62bed7dff839680614ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "options" text, "correctOptionId" character varying NOT NULL, "explanation" text, "topic" character varying NOT NULL DEFAULT 'General', "chapterId" uuid, "examId" uuid, "difficultyWeight" double precision NOT NULL DEFAULT '0.5', "positiveMarks" double precision NOT NULL DEFAULT '1', "negativeMarks" double precision NOT NULL DEFAULT '0.25', "correctCount" integer NOT NULL DEFAULT '0', "totalAttempts" integer NOT NULL DEFAULT '0', "subjectId" uuid, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0865fc43f9c9e4a3c958a25570" ON "question" ("difficultyWeight") `);
        await queryRunner.query(`CREATE TABLE "model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "totalQuestions" integer NOT NULL DEFAULT '0', "scheduledAt" TIMESTAMP, "chapterId" uuid, CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."exam_type_enum" AS ENUM('real_exam', 'question_bank')`);
        await queryRunner.query(`CREATE TABLE "exam" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."exam_type_enum" NOT NULL DEFAULT 'real_exam', "title" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "isPremium" boolean NOT NULL DEFAULT false, "isPublished" boolean NOT NULL DEFAULT false, "price" double precision NOT NULL DEFAULT '0', "defaultPositiveMarks" double precision NOT NULL DEFAULT '1', "defaultNegativeMarks" double precision NOT NULL DEFAULT '0.25', "startTime" TIMESTAMP, "endTime" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_56071ab3a94aeac01f1b5ab74aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "selectedOptionId" character varying NOT NULL, "isCorrect" boolean NOT NULL, "timeSpent" integer, "confidence" double precision, "wasSkipped" boolean NOT NULL DEFAULT false, "wasReviewed" boolean NOT NULL DEFAULT false, "answeredAt" TIMESTAMP NOT NULL DEFAULT now(), "attemptId" uuid, "questionId" uuid, CONSTRAINT "PK_f64544baf2b4dc48ba623ce768f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_972fd71a09bab57f062fdcfdfe" ON "response" ("attemptId") `);
        await queryRunner.query(`CREATE INDEX "IDX_dfd952a4d26cf661248efec5f3" ON "response" ("questionId") `);
        await queryRunner.query(`CREATE TABLE "attempt" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "examId" uuid, "score" double precision NOT NULL, "totalQuestions" integer NOT NULL, "correctAnswers" integer NOT NULL, "timeTaken" integer NOT NULL, "accuracy" double precision NOT NULL DEFAULT '0', "userAnswers" text, "insights" text, "questionTimings" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "modelId" uuid, CONSTRAINT "PK_5f822b29b3128d1c65d3d6c193d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_65b233eb9155519df0f7255d20" ON "attempt" ("examId") `);
        await queryRunner.query(`CREATE INDEX "IDX_28e7109ffc24275d78740c83f3" ON "attempt" ("score") `);
        await queryRunner.query(`CREATE INDEX "IDX_7bf79fee22dbe22c6cab799d7b" ON "attempt" ("timeTaken") `);
        await queryRunner.query(`CREATE INDEX "IDX_834158f1d3f3c3a8299f56b9bc" ON "attempt" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_0d408436aeaa404b2fdd030b55" ON "attempt" ("score", "timeTaken") `);
        await queryRunner.query(`CREATE TABLE "purchase" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stripeSessionId" character varying, "razorpayOrderId" character varying, "razorpayPaymentId" character varying, "amount" double precision NOT NULL, "couponCode" character varying, "discountAmount" double precision NOT NULL DEFAULT '0', "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "examId" uuid, CONSTRAINT "PK_86cc2ebeb9e17fc9c0774b05f69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "model_questions" ("modelId" uuid NOT NULL, "questionId" uuid NOT NULL, CONSTRAINT "PK_4a1532ab7d48f377de3bea67ac1" PRIMARY KEY ("modelId", "questionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6f00ac6ef163977e92953951ff" ON "model_questions" ("modelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5daf34ec763842f9905962130a" ON "model_questions" ("questionId") `);
        await queryRunner.query(`CREATE TABLE "exam_questions_question" ("examId" uuid NOT NULL, "questionId" uuid NOT NULL, CONSTRAINT "PK_819e09c139d395314f8ca9c0e50" PRIMARY KEY ("examId", "questionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_11295ef1e6332790d25510c17b" ON "exam_questions_question" ("examId") `);
        await queryRunner.query(`CREATE INDEX "IDX_28266c51d2322010c18960f486" ON "exam_questions_question" ("questionId") `);
        await queryRunner.query(`CREATE TABLE "exam_models" ("examId" uuid NOT NULL, "modelId" uuid NOT NULL, CONSTRAINT "PK_12d65b6c4f94f25b39c40ffd9dd" PRIMARY KEY ("examId", "modelId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9405487e218a9693ac97243344" ON "exam_models" ("examId") `);
        await queryRunner.query(`CREATE INDEX "IDX_83d03c5fa4be4d97fbbd97aaf5" ON "exam_models" ("modelId") `);
        await queryRunner.query(`ALTER TABLE "subject" ADD CONSTRAINT "FK_6da3060e3028c4226ade815a727" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chapter" ADD CONSTRAINT "FK_0f71d20601ab4944679f398990d" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_e924e3b8137111256e04c8f7500" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_5c2654a2f9b6631a764a6ce2a0c" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_286bbf761d3af4e2fcac4a634d5" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_c56e28883d01c4f74f8af862269" FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "response" ADD CONSTRAINT "FK_972fd71a09bab57f062fdcfdfec" FOREIGN KEY ("attemptId") REFERENCES "attempt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "response" ADD CONSTRAINT "FK_dfd952a4d26cf661248efec5f37" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt" ADD CONSTRAINT "FK_dd8844876037b478f5bb859512e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt" ADD CONSTRAINT "FK_c99a73cb570a472226c0bd17e25" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt" ADD CONSTRAINT "FK_65b233eb9155519df0f7255d20e" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_33520b6c46e1b3971c0a649d38b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_a64bc6c94996f6705b3a84f47ad" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "model_questions" ADD CONSTRAINT "FK_6f00ac6ef163977e92953951ff7" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "model_questions" ADD CONSTRAINT "FK_5daf34ec763842f9905962130a1" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_questions_question" ADD CONSTRAINT "FK_11295ef1e6332790d25510c17b4" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "exam_questions_question" ADD CONSTRAINT "FK_28266c51d2322010c18960f4862" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_models" ADD CONSTRAINT "FK_9405487e218a9693ac972433440" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "exam_models" ADD CONSTRAINT "FK_83d03c5fa4be4d97fbbd97aaf54" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exam_models" DROP CONSTRAINT "FK_83d03c5fa4be4d97fbbd97aaf54"`);
        await queryRunner.query(`ALTER TABLE "exam_models" DROP CONSTRAINT "FK_9405487e218a9693ac972433440"`);
        await queryRunner.query(`ALTER TABLE "exam_questions_question" DROP CONSTRAINT "FK_28266c51d2322010c18960f4862"`);
        await queryRunner.query(`ALTER TABLE "exam_questions_question" DROP CONSTRAINT "FK_11295ef1e6332790d25510c17b4"`);
        await queryRunner.query(`ALTER TABLE "model_questions" DROP CONSTRAINT "FK_5daf34ec763842f9905962130a1"`);
        await queryRunner.query(`ALTER TABLE "model_questions" DROP CONSTRAINT "FK_6f00ac6ef163977e92953951ff7"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_a64bc6c94996f6705b3a84f47ad"`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_33520b6c46e1b3971c0a649d38b"`);
        await queryRunner.query(`ALTER TABLE "attempt" DROP CONSTRAINT "FK_65b233eb9155519df0f7255d20e"`);
        await queryRunner.query(`ALTER TABLE "attempt" DROP CONSTRAINT "FK_c99a73cb570a472226c0bd17e25"`);
        await queryRunner.query(`ALTER TABLE "attempt" DROP CONSTRAINT "FK_dd8844876037b478f5bb859512e"`);
        await queryRunner.query(`ALTER TABLE "response" DROP CONSTRAINT "FK_dfd952a4d26cf661248efec5f37"`);
        await queryRunner.query(`ALTER TABLE "response" DROP CONSTRAINT "FK_972fd71a09bab57f062fdcfdfec"`);
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_c56e28883d01c4f74f8af862269"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_286bbf761d3af4e2fcac4a634d5"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_5c2654a2f9b6631a764a6ce2a0c"`);
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_e924e3b8137111256e04c8f7500"`);
        await queryRunner.query(`ALTER TABLE "chapter" DROP CONSTRAINT "FK_0f71d20601ab4944679f398990d"`);
        await queryRunner.query(`ALTER TABLE "subject" DROP CONSTRAINT "FK_6da3060e3028c4226ade815a727"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_83d03c5fa4be4d97fbbd97aaf5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9405487e218a9693ac97243344"`);
        await queryRunner.query(`DROP TABLE "exam_models"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28266c51d2322010c18960f486"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11295ef1e6332790d25510c17b"`);
        await queryRunner.query(`DROP TABLE "exam_questions_question"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5daf34ec763842f9905962130a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f00ac6ef163977e92953951ff"`);
        await queryRunner.query(`DROP TABLE "model_questions"`);
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d408436aeaa404b2fdd030b55"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_834158f1d3f3c3a8299f56b9bc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7bf79fee22dbe22c6cab799d7b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28e7109ffc24275d78740c83f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65b233eb9155519df0f7255d20"`);
        await queryRunner.query(`DROP TABLE "attempt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dfd952a4d26cf661248efec5f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_972fd71a09bab57f062fdcfdfe"`);
        await queryRunner.query(`DROP TABLE "response"`);
        await queryRunner.query(`DROP TABLE "exam"`);
        await queryRunner.query(`DROP TYPE "public"."exam_type_enum"`);
        await queryRunner.query(`DROP TABLE "model"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0865fc43f9c9e4a3c958a25570"`);
        await queryRunner.query(`DROP TABLE "question"`);
        await queryRunner.query(`DROP TABLE "chapter"`);
        await queryRunner.query(`DROP TABLE "subject"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e11e649824a45d8ed01d597fd9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6620cd026ee2b231beac7cfe57"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChapterWiseTestEnum1771089850419 implements MigrationInterface {
    name = 'AddChapterWiseTestEnum1771089850419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."exam_type_enum" RENAME TO "exam_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."exam_type_enum" AS ENUM('real_exam', 'question_bank', 'previous_year_paper', 'live_exam', 'chapter_wise_test')`);
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "type" TYPE "public"."exam_type_enum" USING "type"::"text"::"public"."exam_type_enum"`);
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "type" SET DEFAULT 'real_exam'`);
        await queryRunner.query(`DROP TYPE "public"."exam_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."exam_type_enum_old" AS ENUM('real_exam', 'question_bank', 'previous_year_paper', 'live_exam')`);
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "type" TYPE "public"."exam_type_enum_old" USING "type"::"text"::"public"."exam_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "exam" ALTER COLUMN "type" SET DEFAULT 'real_exam'`);
        await queryRunner.query(`DROP TYPE "public"."exam_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."exam_type_enum_old" RENAME TO "exam_type_enum"`);
    }

}

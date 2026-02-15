import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChapterWiseTestEnum1739530129000 implements MigrationInterface {
    name = 'AddChapterWiseTestEnum1739530129000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new enum value to existing exam_type_enum
        // PostgreSQL allows adding enum values without recreating the type
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_enum 
                    WHERE enumlabel = 'chapter_wise_test' 
                    AND enumtypid = (
                        SELECT oid FROM pg_type WHERE typname = 'exam_type_enum'
                    )
                ) THEN
                    ALTER TYPE "exam_type_enum" ADD VALUE 'chapter_wise_test';
                END IF;
            END
            $$;
        `);

        console.log('✅ Successfully added chapter_wise_test to exam_type_enum');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // Rollback requires recreating the enum type, which is complex
        // For safety, we'll update any chapter_wise_test exams to real_exam

        console.warn('⚠️ Rolling back enum addition...');
        console.warn('⚠️ Converting chapter_wise_test exams to real_exam type');

        await queryRunner.query(`
            UPDATE "exam" 
            SET "type" = 'real_exam' 
            WHERE "type" = 'chapter_wise_test'
        `);

        // Note: The enum value will remain in the database
        // Manual cleanup required if complete rollback is needed
        console.warn('⚠️ Enum value remains in database. Manual cleanup required for complete rollback.');
    }
}

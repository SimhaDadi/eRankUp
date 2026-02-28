import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePromptShortcutTable1772300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create prompt_shortcut table
        await queryRunner.query(`
            CREATE TABLE "prompt_shortcut" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "topic" character varying(255) NOT NULL,
                "formula" text NOT NULL,
                "keywords" text,
                "embedding" vector(768),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_prompt_shortcut" PRIMARY KEY ("id")
            )
        `);

        // Add index for vector searching
        await queryRunner.query(`
            CREATE INDEX "idx_prompt_shortcut_embedding" ON "prompt_shortcut" 
            USING hnsw ("embedding" vector_cosine_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_prompt_shortcut_embedding"`);
        await queryRunner.query(`DROP TABLE "prompt_shortcut"`);
    }
}

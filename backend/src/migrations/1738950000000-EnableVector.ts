import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableVector1738950000000 implements MigrationInterface {
    name = 'EnableVector1738950000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pgvector extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        // Add embedding column if it doesn't exist
        await queryRunner.query(`ALTER TABLE "question" ADD COLUMN IF NOT EXISTS "embedding" vector(768)`);

        // Create an HNSW index for faster similarity search
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "question_embedding_idx" ON "question" USING hnsw ("embedding" vector_cosine_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF NOT EXISTS "question_embedding_idx"`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN IF EXISTS "embedding"`);
    }

}

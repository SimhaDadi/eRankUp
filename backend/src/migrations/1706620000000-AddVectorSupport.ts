import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVectorSupport1706620000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pgvector extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        // Add embedding column
        await queryRunner.query(`ALTER TABLE "question" ADD COLUMN "embedding" vector(768)`);

        // Add HNSW index for performance
        await queryRunner.query(`CREATE INDEX "idx_question_embedding" ON "question" USING hnsw ("embedding" vector_cosine_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_question_embedding"`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "embedding"`);
    }
}
